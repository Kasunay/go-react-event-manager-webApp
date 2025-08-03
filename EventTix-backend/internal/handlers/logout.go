package handlers

import (
	"encoding/json"
	"net/http"
)

func Logout() http.HandlerFunc {

	return func(writer http.ResponseWriter, request *http.Request) {
		http.SetCookie(writer, &http.Cookie{
			Name:     "token", // this is the name of the cookie where the JWT is stored
			Value:    "",      // we set the value to empty string to "delete" it
			Path:     "/",     // the path for which the cookie is valid
			HttpOnly: true,    // make it HTTP-only so JavaScript can't access the cookie
			MaxAge:   -1,      // this tells the browser to expire the cookie immediately
			Secure:   false,   // use true in production if you use HTTPS
			SameSite: http.SameSiteLaxMode,
		})

		// Send a JSON response indicating successful logout
		writer.Header().Set("Content-Type", "application/json")
		writer.WriteHeader(http.StatusOK) // 200 OK
		json.NewEncoder(writer).Encode(map[string]string{
			"message": "Logged out successfully",
		})
	}
	// Clear the JWT token by setting the cookie's MaxAge to -1 (this will delete it)
}
