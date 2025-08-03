package handlers

import (
	"TickVibe-EventTix-backend/internal/middleware"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

// sendErrorResponse is a helper function to send JSON error responses.
// Assuming this function is defined elsewhere in the handlers package,
// as it was used in the provided UpdatePasswordHandler.

// UserDeleteAccountHandler provides an HTTP handler to delete a user's account.
// It requires the user to be authenticated and to provide their current password
// for verification before deletion.
func UserDeleteAccountHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1. Get user from context (must be authenticated)
		claims, ok := middleware.GetUserFromContext(r)
		if !ok {
			log.Printf("DeleteAccountHandler: Unauthorized access attempt. No user claims in context.")
			sendErrorResponse(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		log.Printf("DeleteAccountHandler: Processing account deletion request for UserID: %s", claims.UserID)

		// 2. Parse request body to get current password for verification
		var body struct {
			CurrentPassword string `json:"currentPassword"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			log.Printf("DeleteAccountHandler: Invalid request body: %v", err)
			sendErrorResponse(w, "Invalid request body. Please provide 'currentPassword'.", http.StatusBadRequest)
			return
		}

		// 3. Get current password hash from DB
		var currentHash string
		err := db.QueryRow(`SELECT password_hash FROM users WHERE id = $1`, claims.UserID).Scan(&currentHash)
		if err != nil {
			if err == sql.ErrNoRows {
				log.Printf("DeleteAccountHandler: UserID %s not found in DB during password hash retrieval for deletion.", claims.UserID)
				sendErrorResponse(w, "User not found or session invalid", http.StatusNotFound)
			} else {
				log.Printf("DeleteAccountHandler: Database error fetching current password hash for UserID %s: %v", claims.UserID, err)
				sendErrorResponse(w, "Failed to retrieve user data for verification", http.StatusInternalServerError)
			}
			return
		}
		log.Printf("DeleteAccountHandler: Retrieved current hash for UserID %s for deletion verification.", claims.UserID)

		// 4. Verify current password
		if err := bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(body.CurrentPassword)); err != nil {
			log.Printf("DeleteAccountHandler: Incorrect current password for UserID %s during deletion attempt. Error: %v", claims.UserID, err)
			sendErrorResponse(w, "Current password is incorrect. Account deletion aborted.", http.StatusUnauthorized)
			return
		}
		log.Printf("DeleteAccountHandler: Current password verified for UserID %s. Proceeding with deletion.", claims.UserID)

		// 5. Execute the DELETE statement
		result, err := db.Exec(`DELETE FROM users WHERE id = $1`, claims.UserID)
		if err != nil {
			log.Printf("DeleteAccountHandler: Failed to execute database delete for UserID %s: %v", claims.UserID, err)
			sendErrorResponse(w, "Failed to delete account from database", http.StatusInternalServerError)
			return
		}

		// 6. Check RowsAffected()
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			log.Printf("DeleteAccountHandler: Failed to get rows affected after delete for UserID %s: %v", claims.UserID, err)
			sendErrorResponse(w, "Failed to verify account deletion", http.StatusInternalServerError)
			return
		}

		if rowsAffected == 0 {
			log.Printf("DeleteAccountHandler: Database delete affected 0 rows for UserID %s. User not found by ID during delete or already deleted.", claims.UserID)
			sendErrorResponse(w, "Account deletion failed: User not found or already deleted.", http.StatusNotFound)
			return
		}

		log.Printf("DeleteAccountHandler: Account successfully deleted for UserID %s. Rows affected: %d", claims.UserID, rowsAffected)
		sendSuccessResponse(w, map[string]interface{}{
			"success": true,
			"message": "Account deleted successfully",
		}, http.StatusOK)
	}
}
