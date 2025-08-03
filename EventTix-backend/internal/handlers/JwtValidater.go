package handlers

import (
	"encoding/json"
	"net/http"

	"TickVibe-EventTix-backend/internal/middleware"
)

func JwtTest() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := middleware.GetUserFromContext(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		// Send user info back
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"userId":          claims.UserID,
			"fullName":        claims.FullName,
			"role":            claims.Role,
			"email":           claims.Email,
			"isEmailVerified": claims.IsEmailVerified,
		})
	}
}
