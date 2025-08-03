package handlers

import (
	"TickVibe-EventTix-backend/internal/middleware"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

func DeleteAccountHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := middleware.GetUserFromContext(r)
		if !ok {
			log.Printf("DeleteAccountHandler: Unauthorized access attempt.")
			sendErrorResponse(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		log.Printf("DeleteAccountHandler: Processing deletion for UserID: %s", claims.UserID)

		// Optional: Require re-authentication by asking for password
		var body struct {
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			log.Printf("DeleteAccountHandler: Invalid request body: %v", err)
			sendErrorResponse(w, "Invalid request", http.StatusBadRequest)
			return
		}

		var passwordHash string
		err := db.QueryRow(`SELECT password_hash FROM users WHERE id = $1`, claims.UserID).Scan(&passwordHash)
		if err != nil {
			if err == sql.ErrNoRows {
				log.Printf("DeleteAccountHandler: UserID %s not found.", claims.UserID)
				sendErrorResponse(w, "User not found", http.StatusNotFound)
			} else {
				log.Printf("DeleteAccountHandler: DB error: %v", err)
				sendErrorResponse(w, "Database error", http.StatusInternalServerError)
			}
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(body.Password)); err != nil {
			log.Printf("DeleteAccountHandler: Invalid password for UserID %s", claims.UserID)
			sendErrorResponse(w, "Incorrect password", http.StatusUnauthorized)
			return
		}

		result, err := db.Exec(`DELETE FROM users WHERE id = $1`, claims.UserID)
		if err != nil {
			log.Printf("DeleteAccountHandler: Failed to delete user %s: %v", claims.UserID, err)
			sendErrorResponse(w, "Failed to delete account", http.StatusInternalServerError)
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			log.Printf("DeleteAccountHandler: No user deleted for UserID %s", claims.UserID)
			sendErrorResponse(w, "Account not found", http.StatusNotFound)
			return
		}

		log.Printf("DeleteAccountHandler: Account deleted for UserID %s", claims.UserID)
		sendSuccessResponse(w, map[string]interface{}{
			"success": true,
			"message": "Account deleted successfully",
		}, http.StatusOK)
	}
}
