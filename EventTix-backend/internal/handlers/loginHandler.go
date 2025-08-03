package handlers

import (
	"TickVibe-EventTix-backend/internal/utils"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

const (
	maxFailedAttempts = 5
	lockoutDuration   = 15 * time.Minute
)

func Login(db *sql.DB) http.HandlerFunc {
	return func(writer http.ResponseWriter, response *http.Request) {
		var request struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}

		if err := json.NewDecoder(response.Body).Decode(&request); err != nil {
			sendErrorResponse(writer, "Invalid request body", http.StatusBadRequest)
			return
		}

		request.Email = strings.TrimSpace(request.Email)
		request.Password = strings.TrimSpace(request.Password)
		if request.Email == "" || request.Password == "" {
			sendErrorResponse(writer, "Email and password are required", http.StatusBadRequest)
			return
		}

		var storedHash, userID, userRole string
		var isEmailVerified bool
		var failedAttempts int
		var accountLockedUntil sql.NullTime
		var fullName string

		err := db.QueryRow(`
			SELECT id, username, password_hash, role, is_email_verified, 
			       failed_login_attempts, account_locked_until
			FROM users WHERE email=$1`, request.Email).
			Scan(&userID, &fullName, &storedHash, &userRole, &isEmailVerified, &failedAttempts, &accountLockedUntil)
		fmt.Print(userID, fullName)
		if err == sql.ErrNoRows {
			sendErrorResponse(writer, "Invalid email or password", http.StatusBadRequest)
			return
		} else if err != nil {
			sendErrorResponse(writer, "Database error", http.StatusInternalServerError)
			return
		}

		// Check if account is locked
		if accountLockedUntil.Valid && accountLockedUntil.Time.After(time.Now()) {
			sendErrorResponse(writer, "Account is temporarily locked due to too many failed attempts", http.StatusTooManyRequests)
			return
		}

		// Check password
		err = bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(request.Password))
		if err != nil {
			// Increment failed attempts and possibly lock account
			failedAttempts++
			lockUntil := sql.NullTime{}
			if failedAttempts >= maxFailedAttempts {
				lockUntil = sql.NullTime{Time: time.Now().Add(lockoutDuration), Valid: true}
			}
			_, _ = db.Exec(`
				UPDATE users 
				SET failed_login_attempts = $1, 
				    account_locked_until = $2, 
				    last_failed_login = NOW() 
				WHERE email = $3`, failedAttempts, lockUntil, request.Email)

			sendErrorResponse(writer, "Invalid email or password", http.StatusUnauthorized)
			return
		}

		// Successful login: reset attempts
		_, _ = db.Exec(`
			UPDATE users 
			SET failed_login_attempts = 0, 
			    account_locked_until = NULL 
			WHERE email = $1`, request.Email)

		tokenString, err := utils.GenerateJWT(userID, userRole, request.Email, isEmailVerified, fullName)
		if err != nil {
			sendErrorResponse(writer, "Failed to generate token", http.StatusInternalServerError)
			return
		}

		http.SetCookie(writer, &http.Cookie{
			Name:     "token",
			Value:    tokenString,
			Path:     "/",
			HttpOnly: true,
			Secure:   false,                          // change to true in production
			SameSite: http.SameSiteLaxMode,           // Changed from None to Lax
			Expires:  time.Now().Add(24 * time.Hour), // Set cookie expiration
			MaxAge:   3600,
		})

		writer.Header().Set("Content-Type", "application/json")
		writer.WriteHeader(http.StatusOK)
		json.NewEncoder(writer).Encode(map[string]interface{}{
			"success": true,
			"message": "Login successful",
			"userId":  userID,
		})
	}
}
