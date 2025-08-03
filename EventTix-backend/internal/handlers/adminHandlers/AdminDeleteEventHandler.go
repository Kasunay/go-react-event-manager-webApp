package adminHandlers

import (
	"TickVibe-EventTix-backend/internal/middleware"
	"database/sql"
	"log"
	"net/http"

	"github.com/google/uuid"
)

func AdminDeleteEventHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := middleware.GetUserFromContext(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		eventIDStr := r.PathValue("id")
		eventID, err := uuid.Parse(eventIDStr)
		if err != nil {
			http.Error(w, "Invalid event ID", http.StatusBadRequest)
			return
		}

		// For creators: ensure they own the event
		if claims.Role == "creator" {
			var count int
			err := db.QueryRow(`
				SELECT COUNT(*) FROM events WHERE id = $1 AND creator_id = $2
			`, eventID, claims.UserID).Scan(&count)
			if err != nil {
				log.Println("Error checking event ownership:", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}
			if count == 0 {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
		}

		// Perform hard delete
		result, err := db.Exec(`DELETE FROM events WHERE id = $1`, eventID)
		if err != nil {
			log.Println("Error deleting event:", err)
			http.Error(w, "Failed to delete event", http.StatusInternalServerError)
			return
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil || rowsAffected == 0 {
			http.Error(w, "Event not found", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
