package handlers

import (
	"database/sql"
	"net/http"
	"time"
)

func VerifyEmail(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1. Get token from query params
		token := r.URL.Query().Get("token")
		if token == "" {
			sendErrorResponse(w, "Missing verification token", http.StatusBadRequest)
			return
		}

		// 2. Lookup token in DB
		var userID string
		var expiresAt time.Time
		err := db.QueryRow(`SELECT user_id, expires_at FROM email_verification_tokens WHERE token = $1`, token).
			Scan(&userID, &expiresAt)
		if err == sql.ErrNoRows {
			sendErrorResponse(w, "Invalid or expired token", http.StatusBadRequest)
			return
		} else if err != nil {
			sendErrorResponse(w, "Database error", http.StatusInternalServerError)
			return
		}

		// 3. Check expiration
		if time.Now().After(expiresAt) {
			sendErrorResponse(w, "Token has expired", http.StatusBadRequest)
			return
		}

		// 4. Mark user as verified
		_, err = db.Exec(`UPDATE users SET is_email_verified = TRUE WHERE id = $1`, userID)
		if err != nil {
			sendErrorResponse(w, "Failed to update user verification", http.StatusInternalServerError)
			return
		}

		// 5. Delete token
		_, _ = db.Exec(`DELETE FROM email_verification_tokens WHERE user_id = $1`, userID)

		// 6. Respond
		sendSuccessResponse(w, map[string]interface{}{
			"success": true,
			"message": "Email successfully verified!",
		}, http.StatusOK)
	}
}
