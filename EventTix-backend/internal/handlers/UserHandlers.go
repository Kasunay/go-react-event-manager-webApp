package handlers

import (
	"TickVibe-EventTix-backend/internal/middleware"
	"TickVibe-EventTix-backend/internal/models"
	"database/sql"
	"log"
	"net/http"
)

func UserTicketsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := middleware.GetUserFromContext(r)
		if !ok {
			log.Println("Unauthorized: no claims found in context")
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		log.Printf("User claims: %+v\n", claims)

		query := `
			SELECT t.id, t.order_id, t.ticket_type_id, t.ticket_code, t.is_used, t.created_at,
			       e.title AS event_title, tt.name AS ticket_type_name
			FROM tickets t
			JOIN events e ON t.event_id = e.id
			JOIN ticket_types tt ON t.ticket_type_id = tt.id
			WHERE t.user_id = $1
			ORDER BY t.created_at DESC
		`

		rows, err := db.Query(query, claims.UserID)
		if err != nil {
			log.Println("DB query error:", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var tickets []models.UserTicketInfo
		for rows.Next() {
			var t models.UserTicketInfo
			if err := rows.Scan(
				&t.ID, &t.OrderID, &t.TicketTypeID, &t.Code, &t.Status,
				&t.CreatedAt, &t.EventTitle, &t.TicketTypeName,
			); err != nil {
				log.Println("Scan error:", err)
				continue
			}
			tickets = append(tickets, t)
		}

		respondWithJSON(w, http.StatusOK, tickets)
	}
}
