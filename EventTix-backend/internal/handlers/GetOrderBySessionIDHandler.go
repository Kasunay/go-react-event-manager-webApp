package handlers

import (
	"TickVibe-EventTix-backend/internal/utils"
	"database/sql"
	"encoding/json"
	"net/http"
	"strings" // To parse the URL path
)

// OrderResponse represents the structure of the order data to be returned
type OrderResponse struct {
	ID               string         `json:"id"`
	UserID           string         `json:"user_id"`
	TotalAmountCents int64          `json:"total_amount_cents"`
	Status           string         `json:"status"`
	EventID          string         `json:"event_id"`
	TicketQuantity   int            `json:"ticket_quantity"`
	CreatedAt        string         `json:"created_at"`
	Tickets          []TicketDetail `json:"tickets"`
}

// TicketDetail represents a single ticket within an order
type TicketDetail struct {
	ID           string `json:"id"`
	TicketTypeID int    `json:"ticket_type_id"`
	TicketCode   string `json:"ticket_code"`
}

// GetOrderBySessionIDHandler retrieves order details by session ID
func GetOrderBySessionIDHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract session ID from the URL path.
		// Assuming the URL pattern is something like "/api/orders/session/{sessionId}"
		// We'll split the path and take the last segment.
		pathSegments := strings.Split(r.URL.Path, "/")
		if len(pathSegments) < 5 { // Expecting ["", "api", "orders", "session", "{sessionId}"]
			utils.WriteJSONError(w, "Invalid URL path", http.StatusBadRequest)
			return
		}
		sessionID := pathSegments[len(pathSegments)-1]

		if sessionID == "" {
			utils.WriteJSONError(w, "Session ID is required", http.StatusBadRequest)
			return
		}

		var order OrderResponse
		var ticketDetailsJSON []byte

		// Query the database for order details using the transaction_id (which is the session ID from Stripe)
		err := db.QueryRow(`
			SELECT
				o.id,
				o.user_id,
				o.total_amount_cents,
				o.status,
				(SELECT t.event_id FROM tickets t WHERE t.order_id = o.id LIMIT 1) AS event_id,
				COUNT(t.id) AS ticket_quantity,
				o.created_at,
				COALESCE(
					json_agg(
						json_build_object(
							'id', t.id,
							'ticket_type_id', t.ticket_type_id,
							'ticket_code', t.ticket_code
						)
					) FILTER (WHERE t.id IS NOT NULL),
					'[]'::json
				) AS tickets_details
			FROM
				orders o
			LEFT JOIN
				tickets t ON o.id = t.order_id
			WHERE
				o.payment_gateway_charge_id = $1
			GROUP BY
				o.id, o.user_id, o.total_amount_cents, o.status, o.created_at`,
			sessionID,
		).Scan(
			&order.ID,
			&order.UserID, // Ensure this is meant to be the user_id from the orders table
			&order.TotalAmountCents,
			&order.Status,
			&order.EventID,        // This will now be populated
			&order.TicketQuantity, // This will now be populated
			&order.CreatedAt,
			&ticketDetailsJSON, // This will now contain the JSON array of tickets
		)

		if err != nil {
			if err == sql.ErrNoRows {
				utils.WriteJSONError(w, "Order not found", http.StatusNotFound)
				return
			}
			utils.WriteJSONError(w, "Failed to retrieve order details", http.StatusInternalServerError)
			return
		}

		// Unmarshal the JSON byte slice into the Tickets slice
		if len(ticketDetailsJSON) > 0 {
			if err := json.Unmarshal(ticketDetailsJSON, &order.Tickets); err != nil {
				utils.WriteJSONError(w, "Failed to parse ticket details", http.StatusInternalServerError)
				return
			}
		} else {
			order.Tickets = []TicketDetail{} // Ensure it's an empty array if no tickets
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(order); err != nil {
			utils.WriteJSONError(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}
