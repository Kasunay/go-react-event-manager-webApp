package handlers

import (
	"TickVibe-EventTix-backend/internal/middleware" // Adjust path as needed
	"database/sql"
	"encoding/json"
	"net/http"
)

// ProfileResponse struct defines the JSON response for user profile
type ProfileResponse struct {
	UserID          string `json:"userId"`
	Email           string `json:"email"`
	Role            string `json:"role"`
	IsEmailVerified bool   `json:"is_email_verified"`
	FullName        string `json:"fullName"`
}

// ProfileHandler fetches user profile details
func ProfileHandler(db *sql.DB) http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		// Get claims from the context (set by RequireAuth middleware)
		claims, ok := middleware.GetUserFromContext(request)
		if !ok {
			sendErrorResponse(writer, "Unauthorized - user context not found", http.StatusUnauthorized)
			return
		}

		// Query database for full user profile details using the UserID from claims
		var email string
		var role string
		var isEmailVerified bool
		var fullName string // Use sql.NullString for nullable fields

		err := db.QueryRow(
			"SELECT username, email, role, is_email_verified FROM users WHERE id=$1",
			claims.UserID,
		).Scan(&fullName, &email, &role, &isEmailVerified)

		if err == sql.ErrNoRows {
			sendErrorResponse(writer, "User not found", http.StatusNotFound)
			return
		} else if err != nil {
			sendErrorResponse(writer, "Database error fetching profile", http.StatusInternalServerError)
			return
		}

		profile := ProfileResponse{
			UserID:          claims.UserID,
			Email:           email,
			Role:            role,
			IsEmailVerified: isEmailVerified,
			FullName:        fullName, // Will be empty string if NULL
		}

		writer.Header().Set("Content-Type", "application/json")
		writer.WriteHeader(http.StatusOK)
		json.NewEncoder(writer).Encode(profile)
	}
}
