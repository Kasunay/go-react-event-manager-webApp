package middleware

import (
	"encoding/base64"
	"net/http"
	"strings"
)

func BasicAuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Replace with your desired username and password
		const expectedUsername = "admin"
		const expectedPassword = "securepassword" // Change this to a strong, unique password

		// Get the Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			// No Authorization header, request credentials
			w.Header().Set("WWW-Authenticate", `Basic realm="Restricted"`)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Check if it's Basic authentication
		if !strings.HasPrefix(authHeader, "Basic ") {
			http.Error(w, "Unauthorized: Invalid authentication scheme", http.StatusUnauthorized)
			return
		}

		// Decode the base64 credentials
		encodedCreds := strings.TrimPrefix(authHeader, "Basic ")
		decodedCreds, err := base64.StdEncoding.DecodeString(encodedCreds)
		if err != nil {
			http.Error(w, "Unauthorized: Invalid base64 encoding", http.StatusUnauthorized)
			return
		}

		// Split username and password
		creds := strings.SplitN(string(decodedCreds), ":", 2)
		if len(creds) != 2 {
			http.Error(w, "Unauthorized: Invalid credentials format", http.StatusUnauthorized)
			return
		}

		username := creds[0]
		password := creds[1]

		// Validate credentials
		if username == expectedUsername && password == expectedPassword {
			// Credentials are valid, call the next handler
			next.ServeHTTP(w, r)
			return
		}

		// Invalid credentials
		w.Header().Set("WWW-Authenticate", `Basic realm="Restricted"`)
		http.Error(w, "Unauthorized: Invalid credentials", http.StatusUnauthorized)
	}
}
