package handlers

import (
	"TickVibe-EventTix-backend/internal/utils"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/stripe/stripe-go/v78"
	"github.com/stripe/stripe-go/v78/checkout/session"
)

type CheckoutRequest struct {
	EventID string `json:"event_id"`
	UserID  string `json:"user_id"`
	Tickets []struct {
		TicketTypeID int `json:"ticket_type_id"`
		Quantity     int `json:"quantity"`
	} `json:"tickets"`
}

func CreateCheckoutSessionHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req CheckoutRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			utils.WriteJSONError(w, "Invalid request", http.StatusBadRequest)
			return
		}

		stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
		if stripe.Key == "" {
			utils.WriteJSONError(w, "Server mis‑config", http.StatusInternalServerError)
			return
		}

		var lineItems []*stripe.CheckoutSessionLineItemParams
		var totalAmount int64 // accumulate total amount from tickets
		var totalQuantity int // accumulate total quantity from tickets

		for _, t := range req.Tickets {
			var name string
			var price int64

			if err := db.QueryRow(
				`SELECT name, price_cents FROM ticket_types 
                WHERE id = $1 AND event_id = $2`,
				t.TicketTypeID, req.EventID).Scan(&name, &price); err != nil {
				utils.WriteJSONError(w, "Invalid ticket type", http.StatusBadRequest)
				return
			}

			totalAmount += price * int64(t.Quantity)
			totalQuantity += t.Quantity

			lineItems = append(lineItems, &stripe.CheckoutSessionLineItemParams{
				Quantity: stripe.Int64(int64(t.Quantity)),
				PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
					Currency:   stripe.String("pln"),
					UnitAmount: stripe.Int64(price),
					ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
						Name: stripe.String(name),
					},
				},
			})
		}

		var ticketTypesParam string
		for i, t := range req.Tickets {
			entry := strconv.Itoa(t.TicketTypeID) + ":" + strconv.Itoa(t.Quantity)
			if i > 0 {
				ticketTypesParam += ","
			}
			ticketTypesParam += entry
		}

		successURL := "http://localhost:5173/success" +
			"?session_id={CHECKOUT_SESSION_ID}" +
			"&user_id=" + req.UserID +
			"&event_id=" + req.EventID +
			"&quantity=" + strconv.Itoa(totalQuantity)

		params := &stripe.CheckoutSessionParams{
			PaymentMethodTypes: stripe.StringSlice([]string{"card"}),
			LineItems:          lineItems,
			Mode:               stripe.String(string(stripe.CheckoutSessionModePayment)),
			SuccessURL:         stripe.String(successURL),
			CancelURL:          stripe.String("http://localhost:8080/events/" + req.EventID)}

		s, err := session.New(params)
		if err != nil {
			log.Println("Stripe error:", err)
			utils.WriteJSONError(w, "Could not create Stripe session", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"url":            s.URL,
			"transaction_id": s.ID,
		})
	}
}
