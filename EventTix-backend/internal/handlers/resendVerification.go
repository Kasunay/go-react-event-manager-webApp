package handlers

import (
	"TickVibe-EventTix-backend/internal/utils"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

func ResendVerification(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Email string `json:"email"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			sendErrorResponse(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// 1. Find user
		var userID string
		var isVerified bool
		err := db.QueryRow(`SELECT id, is_email_verified FROM users WHERE email = $1`, body.Email).
			Scan(&userID, &isVerified)
		if err == sql.ErrNoRows {
			sendErrorResponse(w, "User not found", http.StatusNotFound)
			return
		} else if err != nil {
			sendErrorResponse(w, "Database error", http.StatusInternalServerError)
			return
		}

		if isVerified {
			sendErrorResponse(w, "Email is already verified", http.StatusConflict)
			return
		}

		// 2. Delete existing token (optional: could also update)
		_, _ = db.Exec(`DELETE FROM email_verification_tokens WHERE user_id = $1`, userID)

		// 3. Generate and insert new token
		token, err := utils.GenerateToken()
		if err != nil {
			sendErrorResponse(w, "Failed to generate token", http.StatusInternalServerError)
			return
		}
		expiresAt := time.Now().Add(24 * time.Hour)
		_, err = db.Exec(`INSERT INTO email_verification_tokens (user_id, token, expires_at)
		                  VALUES ($1, $2, $3)`, userID, token, expiresAt)
		if err != nil {
			sendErrorResponse(w, "Failed to store token", http.StatusInternalServerError)
			return
		}

		verificationLink := fmt.Sprintf("https://localhost:5173/verify-email?token=%s", token)
		subject := "Verify your TickVibe account"
		plainText := fmt.Sprintf("Click this link to verify your account: %s", verificationLink)
		html := fmt.Sprintf("<p>Click <a href='%s'>here</a> to verify your account.</p>", verificationLink)

		err = utils.SendEmail(body.Email, subject, plainText, html)
		if err != nil {
			sendErrorResponse(w, "Failed to send verification email", http.StatusInternalServerError)
			return
		}

		sendSuccessResponse(w, map[string]interface{}{
			"success": true,
			"message": "Verification email resent",
		}, http.StatusOK)
	}
}
