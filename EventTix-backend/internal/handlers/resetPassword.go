package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"TickVibe-EventTix-backend/internal/utils"

	"golang.org/x/crypto/bcrypt"
)

func ResetPassword(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Token       string `json:"token"`
			NewPassword string `json:"newPassword"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			sendErrorResponse(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// 1. Validate new password complexity
		if valid, message := utils.IsPasswordComplex(body.NewPassword); !valid {
			sendErrorResponse(w, message, http.StatusBadRequest)
			return
		}

		// 2. Lookup token
		var userID string
		var expiresAt time.Time
		err := db.QueryRow(`SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1`, body.Token).
			Scan(&userID, &expiresAt)
		if err == sql.ErrNoRows {
			sendErrorResponse(w, "Invalid or expired token", http.StatusBadRequest)
			return
		} else if err != nil {
			sendErrorResponse(w, "Database error", http.StatusInternalServerError)
			return
		}

		if time.Now().After(expiresAt) {
			sendErrorResponse(w, "Token has expired", http.StatusBadRequest)
			return
		}

		// 3. Check if the new password is the same as the old one
		var currentPasswordHash string
		err = db.QueryRow(`SELECT password_hash FROM users WHERE id = $1`, userID).Scan(&currentPasswordHash)
		if err != nil {
			sendErrorResponse(w, "Failed to retrieve current password", http.StatusInternalServerError)
			return
		}

		// Compare the new password with the current password
		if bcrypt.CompareHashAndPassword([]byte(currentPasswordHash), []byte(body.NewPassword)) == nil {
			sendErrorResponse(w, "Your new password cannot be the same as the old password", http.StatusBadRequest)
			return
		}

		// 4. Hash new password
		hashedPassword, err := utils.HashPassword(body.NewPassword)
		if err != nil {
			sendErrorResponse(w, "Failed to process password", http.StatusInternalServerError)
			return
		}

		// 5. Update user's password
		_, err = db.Exec(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
			hashedPassword, userID)
		if err != nil {
			sendErrorResponse(w, "Failed to update password", http.StatusInternalServerError)
			return
		}

		// 6. Delete token
		_, _ = db.Exec(`DELETE FROM password_reset_tokens WHERE user_id = $1`, userID)

		sendSuccessResponse(w, map[string]interface{}{
			"success": true,
			"message": "Password reset successful",
		}, http.StatusOK)
	}
}
