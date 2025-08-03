package handlers

import (
	"TickVibe-EventTix-backend/internal/utils"
	"database/sql"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"strings"
	"time"
)

func ForgotPassword(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Email string `json:"email"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			sendErrorResponse(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// 1. Check if user exists
		var userID string
		err := db.QueryRow(`SELECT id FROM users WHERE email = $1`, body.Email).Scan(&userID)
		if err == sql.ErrNoRows {
			// Don't expose if user exists
			sendSuccessResponse(w, map[string]interface{}{
				"message": "If that email is registered, a reset link has been sent.",
			}, http.StatusOK)
			return
		} else if err != nil {
			sendErrorResponse(w, "Database error", http.StatusInternalServerError)
			return
		}

		// 2. Generate and store token
		token, err := utils.GenerateToken()
		if err != nil {
			sendErrorResponse(w, "Failed to generate token", http.StatusInternalServerError)
			return
		}
		expiresAt := time.Now().Add(1 * time.Hour)

		_, _ = db.Exec(`DELETE FROM password_reset_tokens WHERE user_id = $1`, userID) // cleanup
		_, err = db.Exec(`INSERT INTO password_reset_tokens (user_id, token, expires_at)
                          VALUES ($1, $2, $3)`, userID, token, expiresAt)
		if err != nil {
			sendErrorResponse(w, "Failed to store token", http.StatusInternalServerError)
			return
		}

		// 3. Prepare email content
		resetLink := fmt.Sprintf("http://localhost:8080/reset-password?token=%s", token)
		subject := "Reset Your TickVibe Password"

		// Load and parse the email template
		tmpl, err := template.ParseFiles("internal/templates/reset_password_improved.html")
		if err != nil {
			// Fallback to simple HTML if template fails to load
			plainText := fmt.Sprintf("Click this link to reset your password: %s", resetLink)
			html := fmt.Sprintf(`
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
                    <h2>Reset Your TickVibe Password</h2>
                    <p>Click the link below to reset your password:</p>
                    <p><a href="%s" style="background-color: #facc15; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a></p>
                    <p><small>This link expires in 1 hour for your security.</small></p>
                    <p><small>If you didn't request this, you can safely ignore this email.</small></p>
                </div>
            `, resetLink)

			err = utils.SendEmail(body.Email, subject, plainText, html)
		} else {
			// Use the template
			var htmlBuffer strings.Builder
			data := struct {
				Link string
			}{
				Link: resetLink,
			}

			err = tmpl.Execute(&htmlBuffer, data)
			if err != nil {
				sendErrorResponse(w, "Failed to generate email content", http.StatusInternalServerError)
				return
			}

			plainText := fmt.Sprintf("Reset your TickVibe password by clicking this link: %s\n\nThis link expires in 1 hour for your security.\n\nIf you didn't request this, you can safely ignore this email.", resetLink)
			err = utils.SendEmail(body.Email, subject, plainText, htmlBuffer.String())
		}

		if err != nil {
			sendErrorResponse(w, "Failed to send reset email", http.StatusInternalServerError)
			return
		}

		sendSuccessResponse(w, map[string]interface{}{
			"message": "If that email is registered, a reset link has been sent.",
		}, http.StatusOK)
	}
}
