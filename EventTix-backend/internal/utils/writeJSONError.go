package utils

import (
	"encoding/json"
	"net/http"
)

func WriteJSONError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func WriteJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json") // Set the Content-Type header to application/json
	w.WriteHeader(status)                              // Write the HTTP status code

	// Encode the data to JSON and write it to the response body.
	if err := json.NewEncoder(w).Encode(data); err != nil {
		// If there's an error encoding the JSON, log it and try to send a generic error.
		// This should ideally not happen if 'data' is a valid JSON-encodable type.
		http.Error(w, "Failed to encode JSON response", http.StatusInternalServerError)
		return
	}
}
