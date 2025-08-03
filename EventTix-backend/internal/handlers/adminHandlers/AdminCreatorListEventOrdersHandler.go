package adminHandlers

import (
	"TickVibe-EventTix-backend/internal/middleware"
	"TickVibe-EventTix-backend/internal/models"
	"database/sql"
	"log"
	"net/http"

	"github.com/google/uuid"
)

func AdminCreatorListEventOrdersHandler(db *sql.DB) http.HandlerFunc {
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

		if claims.Role == "creator" {
			var count int
			err := db.QueryRow(`SELECT COUNT(*) FROM events WHERE id = $1 AND creator_id = $2`, eventID, claims.UserID).Scan(&count)
			if err != nil || count == 0 {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
		}

		query := `
			SELECT DISTINCT o.id, o.user_id, u.email, o.status, o.total_amount_cents,
			                o.payment_gateway_charge_id, o.created_at
			FROM orders o
			JOIN users u ON o.user_id = u.id
			JOIN tickets t ON t.order_id = o.id
			WHERE t.event_id = $1
			ORDER BY o.created_at DESC
		`

		rows, err := db.Query(query, eventID)
		if err != nil {
			log.Println("Query error:", err)
			http.Error(w, "Failed to load orders", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var orders []models.OrderInfo
		for rows.Next() {
			var o models.OrderInfo
			if err := rows.Scan(&o.ID, &o.UserID, &o.BuyerEmail, &o.Status,
				&o.TotalAmount, &o.PaymentRef, &o.CreatedAt); err != nil {
				log.Println("Scan error:", err)
				continue
			}
			orders = append(orders, o)
		}

		respondWithJSON(w, http.StatusOK, orders)
	}
}
