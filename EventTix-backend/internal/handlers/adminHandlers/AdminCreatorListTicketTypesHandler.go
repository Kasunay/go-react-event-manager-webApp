package adminHandlers

import (
	"TickVibe-EventTix-backend/internal/middleware"
	"TickVibe-EventTix-backend/internal/models"
	"database/sql"
	"log"
	"net/http"

	"github.com/google/uuid"
)

func AdminCreatorListTicketTypesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := middleware.GetUserFromContext(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		eventIDStr := r.PathValue("event_id")
		eventID, err := uuid.Parse(eventIDStr)
		if err != nil {
			http.Error(w, "Invalid event ID", http.StatusBadRequest)
			return
		}

		// Check if creator owns the event (optional for admin)
		if claims.Role == "creator" {
			var count int
			err := db.QueryRow(`SELECT COUNT(*) FROM events WHERE id = $1 AND creator_id = $2`, eventID, claims.UserID).Scan(&count)
			if err != nil || count == 0 {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
		}

		rows, err := db.Query(`
			SELECT id, name, description, price_cents, total_quantity, available_quantity, created_at, updated_at
			FROM ticket_types
			WHERE event_id = $1
			ORDER BY id ASC
		`, eventID)
		if err != nil {
			log.Println("DB error fetching ticket types:", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var ticketTypes []models.TicketTypeOut
		for rows.Next() {
			var t models.TicketTypeOut
			if err := rows.Scan(&t.ID, &t.Name, &t.Description, &t.PriceCents, &t.TotalQuantity, &t.AvailableQuantity, &t.CreatedAt, &t.UpdatedAt); err != nil {
				log.Println("Scan error:", err)
				continue
			}
			ticketTypes = append(ticketTypes, t)
		}

		respondWithJSON(w, http.StatusOK, ticketTypes)
	}
}
