package handlers

import (
	"TickVibe-EventTix-backend/internal/middleware"
	"TickVibe-EventTix-backend/internal/utils"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

func UpdatePasswordHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get user from context (must be authenticated)
		claims, ok := middleware.GetUserFromContext(r)
		if !ok {
			log.Printf("UpdatePasswordHandler: Unauthorized access attempt. No user claims in context.")
			sendErrorResponse(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		log.Printf("UpdatePasswordHandler: Processing request for UserID: %s", claims.UserID)

		var body struct {
			CurrentPassword string `json:"currentPassword"`
			NewPassword     string `json:"newPassword"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			log.Printf("UpdatePasswordHandler: Invalid request body: %v", err)
			sendErrorResponse(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// Validate password complexity
		if valid, message := utils.IsPasswordComplex(body.NewPassword); !valid {
			log.Printf("UpdatePasswordHandler: New password complexity validation failed for UserID %s: %s", claims.UserID, message)
			sendErrorResponse(w, message, http.StatusBadRequest)
			return
		}

		// Get current password hash from DB
		var currentHash string
		err := db.QueryRow(`SELECT password_hash FROM users WHERE id = $1`, claims.UserID).Scan(&currentHash)
		if err != nil {
			if err == sql.ErrNoRows {
				log.Printf("UpdatePasswordHandler: UserID %s not found in DB during password hash retrieval.", claims.UserID)
				sendErrorResponse(w, "User not found or session invalid", http.StatusNotFound)
			} else {
				log.Printf("UpdatePasswordHandler: Database error fetching current password hash for UserID %s: %v", claims.UserID, err)
				sendErrorResponse(w, "Failed to retrieve user data", http.StatusInternalServerError)
			}
			return
		}
		log.Printf("UpdatePasswordHandler: Retrieved current hash for UserID %s.", claims.UserID)

		// Check current password
		if err := bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(body.CurrentPassword)); err != nil {
			log.Printf("UpdatePasswordHandler: Incorrect current password for UserID %s. Error: %v", claims.UserID, err)
			sendErrorResponse(w, "Current password is incorrect", http.StatusBadRequest)
			return
		}
		log.Printf("UpdatePasswordHandler: Current password verified for UserID %s.", claims.UserID)

		// Ensure new password is different
		if bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(body.NewPassword)) == nil {
			log.Printf("UpdatePasswordHandler: New password is same as old for UserID %s.", claims.UserID)
			sendErrorResponse(w, "New password must be different from the old password", http.StatusBadRequest)
			return
		}
		log.Printf("UpdatePasswordHandler: New password is different from old for UserID %s.", claims.UserID)

		// Hash and update
		newHash, err := utils.HashPassword(body.NewPassword)
		if err != nil {
			log.Printf("UpdatePasswordHandler: Failed to hash new password for UserID %s: %v", claims.UserID, err)
			sendErrorResponse(w, "Failed to hash password", http.StatusInternalServerError)
			return
		}
		log.Printf("UpdatePasswordHandler: New password hashed for UserID %s.", claims.UserID)

		// Execute the UPDATE statement
		result, err := db.Exec(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, newHash, claims.UserID)
		if err != nil {
			log.Printf("UpdatePasswordHandler: Failed to execute database update for UserID %s: %v", claims.UserID, err)
			sendErrorResponse(w, "Failed to update password in database", http.StatusInternalServerError)
			return
		}

		// IMPORTANT: Check RowsAffected()
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			log.Printf("UpdatePasswordHandler: Failed to get rows affected after update for UserID %s: %v", claims.UserID, err)
			sendErrorResponse(w, "Failed to verify password update", http.StatusInternalServerError)
			return
		}

		if rowsAffected == 0 {
			log.Printf("UpdatePasswordHandler: Database update affected 0 rows for UserID %s. User not found by ID during update or no change needed.", claims.UserID)
			// This is the crucial part: If 0 rows were affected, the password was not updated.
			// This could happen if the user was somehow deleted, or the ID from claims is incorrect.
			sendErrorResponse(w, "Password update failed: User not found or no changes applied.", http.StatusNotFound) // Or Bad Request, or Internal Server Error depending on what 0 rows affected implies
			return
		}

		log.Printf("UpdatePasswordHandler: Password updated successfully for UserID %s. Rows affected: %d", claims.UserID, rowsAffected)
		sendSuccessResponse(w, map[string]interface{}{
			"success": true,
			"message": "Password updated successfully",
		}, http.StatusOK)
	}
}
