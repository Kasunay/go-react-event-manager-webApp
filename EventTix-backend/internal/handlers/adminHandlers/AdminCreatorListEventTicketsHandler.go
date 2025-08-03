package adminHandlers

import (
	"TickVibe-EventTix-backend/internal/middleware"
	"TickVibe-EventTix-backend/internal/models"
	"database/sql"
	"log"
	"net/http"

	"github.com/google/uuid"
)

func AdminCreatorListEventTicketsHandler(db *sql.DB) http.HandlerFunc {
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

		// For creators: make sure they own this event
		if claims.Role == "creator" {
			var count int
			err := db.QueryRow(`SELECT COUNT(*) FROM events WHERE id = $1 AND creator_id = $2`, eventID, claims.UserID).Scan(&count)
			if err != nil || count == 0 {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
		}

		query := `
			SELECT t.id, t.order_id, t.ticket_type_id, t.ticket_code, t.is_used, t.created_at,
      		 u.email AS buyer_email, tt.name AS ticket_type_name
			FROM tickets t
			JOIN orders o ON t.order_id = o.id
			JOIN users u ON o.user_id = u.id
			JOIN ticket_types tt ON t.ticket_type_id = tt.id
			WHERE t.event_id = $1
			ORDER BY t.created_at DESC
		`

		rows, err := db.Query(query, eventID)
		if err != nil {
			log.Println("DB query error:", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var tickets []models.AdminTicketInfo
		for rows.Next() {
			var t models.AdminTicketInfo
			if err := rows.Scan(
				&t.ID, &t.OrderID, &t.TicketTypeID, &t.Code, &t.Status,
				&t.CreatedAt, &t.UserEmail, &t.TicketTypeName,
			); err != nil {
				log.Println("Scan error:", err)
				continue
			}
			tickets = append(tickets, t)
		}

		respondWithJSON(w, http.StatusOK, tickets)
	}
}
