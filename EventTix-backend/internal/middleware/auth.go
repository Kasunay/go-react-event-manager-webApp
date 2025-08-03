package middleware

import (
	"TickVibe-EventTix-backend/internal/utils"
	"context"
	"net/http"
)

type contextKey string

const userContextKey contextKey = "user"

func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {

		cookie, err := request.Cookie("token")
		if err != nil {
			http.Error(writer, "Unauthorized - token not found", http.StatusUnauthorized)
			return
		}

		claims, err := utils.ParseJWT(cookie.Value)
		if err != nil {
			http.Error(writer, "Unauthorized - invalid token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(request.Context(), userContextKey, claims)
		request = request.WithContext(ctx)

		next(writer, request)
	}
}

// GetUserFromContext extracts user info from context
func GetUserFromContext(r *http.Request) (*utils.Claims, bool) {
	claims, ok := r.Context().Value(userContextKey).(*utils.Claims)
	return claims, ok
}

func RequireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := GetUserFromContext(r)
		if !ok || claims.Role != "admin" {
			http.Error(w, "Forbidden - admins only", http.StatusForbidden)
			return
		}
		next(w, r)
	})
}

func RequireAdminOrCreator(next http.HandlerFunc) http.HandlerFunc {
	return RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := GetUserFromContext(r)
		if !ok || (claims.Role != "admin" && claims.Role != "creator") {
			http.Error(w, "Forbidden - admin or creator access required", http.StatusForbidden)
			return
		}
		next(w, r)
	})
}

func RequireStaffOrHigher(next http.HandlerFunc) http.HandlerFunc {
	return RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := GetUserFromContext(r)
		if !ok || (claims.Role != "staff" && claims.Role != "admin" && claims.Role != "creator") {
			http.Error(w, "Forbidden - staff access or higher required", http.StatusForbidden)
			return
		}
		next(w, r)
	})
}
