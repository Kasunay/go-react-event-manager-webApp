package handlers

import (
	"TickVibe-EventTix-backend/internal/utils"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"math"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/skip2/go-qrcode"
)

// Define the structure for individual ticket details within the record
type PurchasedTicket struct {
	TicketTypeID int `json:"ticket_type_id"`
	Quantity     int `json:"quantity"`
}

// Update the Record struct to include the detailed tickets array
type Record struct {
	SessionID     string            `json:"transactionId"`
	EventID       *string           `json:"eventId"`
	UserID        string            `json:"userId"`
	TotalAmount   string            `json:"totalAmount"`
	Tickets       []PurchasedTicket `json:"tickets"`       // Changed to an array of PurchasedTicket
	TotalQuantity int               `json:"totalQuantity"` // Include totalQuantity from frontend
}

func PayTest(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var rec Record
		if err := json.NewDecoder(r.Body).Decode(&rec); err != nil {
			log.Printf("Error decoding request payload: %v", err) // Log the actual error
			utils.WriteJSONError(w, "Invalid request payload", http.StatusBadRequest)
			return
		}

		log.Printf("Received transaction data: %+v", rec) // Log the received data for debugging

		WriteOrders(db, rec)

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"status": "record created",
		})
	}
}

func WriteOrders(db *sql.DB, rec Record) {
	amountStr := strings.TrimSpace(rec.TotalAmount)
	amountFloat, err := parseAmount(amountStr)
	if err != nil {
		log.Println("Error parsing amount:", err)
		return
	}
	amountCents := int64(math.Round(amountFloat * 100))

	// Use the totalQuantity directly from the frontend payload
	totalQuantity := rec.TotalQuantity

	// Insert into orders and get order_id
	var orderID string
	err = db.QueryRow(
		`INSERT INTO orders (user_id, total_amount_cents, status, payment_gateway_charge_id, event_id, ticket_quantity)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
		rec.UserID, amountCents, "completed", rec.SessionID, rec.EventID, totalQuantity,
	).Scan(&orderID)

	if err != nil {
		fmt.Print("Error inserting order: ", err)
		return
	}

	// Store ticket details for email
	var ticketDetails []TicketEmailData

	// Insert individual tickets based on the received 'Tickets' array
	ticketIndex := 1
	for _, ticketSelection := range rec.Tickets {
		for i := 0; i < ticketSelection.Quantity; i++ { // Loop for the quantity of THIS specific ticket type
			ticketID := uuid.New().String() // Create a new uuid for Ticket id

			// Generate QR code for the ticket
			ticketCode, err := generateTicketQRCode(ticketID)
			if err != nil {
				log.Printf("Error generating QR code for ticket %s: %v", ticketID, err)
				continue // Continue to next ticket if QR generation fails
			}

			_, err = db.Exec(
				`INSERT INTO tickets (id, order_id, event_id, user_id, ticket_type_id, ticket_code)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
				ticketID, orderID, rec.EventID, rec.UserID, ticketSelection.TicketTypeID, ticketCode,
			)

			if err != nil {
				fmt.Printf("Error inserting ticket (order_id: %s, type: %d, #%d): %v\n", orderID, ticketSelection.TicketTypeID, i+1, err)
				continue // Continue to next ticket if one fails
			}

			// Get ticket type name for email
			var ticketTypeName string
			err = db.QueryRow("SELECT name FROM ticket_types WHERE id = $1", ticketSelection.TicketTypeID).Scan(&ticketTypeName)
			if err != nil {
				ticketTypeName = "Standard Ticket"
			}

			// Add to email data
			ticketDetails = append(ticketDetails, TicketEmailData{
				ID:       ticketID,
				Index:    ticketIndex,
				TypeName: ticketTypeName,
				QRCode:   ticketCode,
			})
			ticketIndex++
		}
	}

	// Send confirmation email with tickets
	go sendTicketConfirmationEmail(db, rec, orderID, ticketDetails, amountCents)
}

// Add these structs at the top of the file
type TicketEmailData struct {
	ID       string
	Index    int
	TypeName string
	QRCode   string
}

type TicketEmailTemplate struct {
	EventTitle    string
	EventDateTime string
	EventLocation string
	TotalTickets  int
	TotalAmount   string
	Tickets       []TicketEmailData
}

// Add this new function
func sendTicketConfirmationEmail(db *sql.DB, rec Record, orderID string, tickets []TicketEmailData, amountCents int64) {
	// Get user email
	var userEmail string
	err := db.QueryRow("SELECT email FROM users WHERE id = $1", rec.UserID).Scan(&userEmail)
	if err != nil {
		log.Printf("Error getting user email for order %s: %v", orderID, err)
		return
	}

	// Get event details
	var eventTitle, eventLocation, eventDateTime string
	err = db.QueryRow(`
        SELECT e.title, 
               COALESCE(e.location_name, '') || COALESCE(', ' || e.location_address, '') as location,
               to_char(e.start_time, 'Day, Month DD, YYYY at HH12:MI AM') as formatted_date
        FROM events e 
        WHERE e.id = $1`, rec.EventID).Scan(&eventTitle, &eventLocation, &eventDateTime)
	if err != nil {
		log.Printf("Error getting event details for order %s: %v", orderID, err)
		return
	}

	// Prepare template data
	templateData := TicketEmailTemplate{
		EventTitle:    eventTitle,
		EventDateTime: eventDateTime,
		EventLocation: eventLocation,
		TotalTickets:  len(tickets),
		TotalAmount:   fmt.Sprintf("%.2f PLN", float64(amountCents)/100),
		Tickets:       tickets,
	}

	// Parse and execute template
	tmpl, err := template.ParseFiles("internal/templates/ticket_confirmation.html")
	if err != nil {
		log.Printf("Error parsing ticket email template: %v", err)
		// Fallback to simple email
		sendSimpleTicketEmail(userEmail, eventTitle, tickets)
		return
	}

	var htmlBuffer strings.Builder
	err = tmpl.Execute(&htmlBuffer, templateData)
	if err != nil {
		log.Printf("Error executing ticket email template: %v", err)
		sendSimpleTicketEmail(userEmail, eventTitle, tickets)
		return
	}

	// Send email
	subject := fmt.Sprintf("Your TickVibe Tickets for %s", eventTitle)
	plainText := fmt.Sprintf("Your tickets for %s are attached. Total tickets: %d. Please keep this email safe for entry to the event.", eventTitle, len(tickets))

	err = utils.SendEmail(userEmail, subject, plainText, htmlBuffer.String())
	if err != nil {
		log.Printf("Error sending ticket confirmation email to %s: %v", userEmail, err)
	} else {
		log.Printf("Ticket confirmation email sent successfully to %s for order %s", userEmail, orderID)
	}
}

// Fallback simple email function
func sendSimpleTicketEmail(userEmail, eventTitle string, tickets []TicketEmailData) {
	subject := fmt.Sprintf("Your TickVibe Tickets for %s", eventTitle)

	var htmlContent strings.Builder
	htmlContent.WriteString(fmt.Sprintf(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
            <h2>🎫 Your TickVibe Tickets</h2>
            <p>Thank you for your purchase! Your tickets for <strong>%s</strong> are ready.</p>
            <h3>Your Tickets:</h3>
    `, eventTitle))

	for _, ticket := range tickets {
		htmlContent.WriteString(fmt.Sprintf(`
            <div style="border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 8px;">
                <h4>Ticket #%d</h4>
                <p><strong>ID:</strong> %s</p>
                <p><strong>Type:</strong> %s</p>
                <div style="text-align: center; margin: 15px 0;">
                    <img src="data:image/png;base64,%s" alt="QR Code" width="150" height="150" style="border: 1px solid #ddd; padding: 10px;">
                    <p><small>Present this QR code at the venue entrance</small></p>
                </div>
            </div>
        `, ticket.Index, ticket.ID, ticket.TypeName, ticket.QRCode))
	}

	htmlContent.WriteString(`
            <p style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 5px;">
                <strong>Important:</strong> Keep this email safe and arrive at the venue 30 minutes early.
            </p>
        </div>
    `)

	plainText := fmt.Sprintf("Your tickets for %s are ready. Total tickets: %d. Please check your email for QR codes.", eventTitle, len(tickets))

	err := utils.SendEmail(userEmail, subject, plainText, htmlContent.String())
	if err != nil {
		log.Printf("Error sending simple ticket email: %v", err)
	}
}

func parseAmount(amountStr string) (float64, error) {
	re := regexp.MustCompile(`[\d.,]+`)
	match := re.FindString(amountStr)
	if match == "" {
		return 0, fmt.Errorf("no numeric amount found in %q", amountStr)
	}
	// Replace first comma with dot to handle European decimal comma
	normalized := strings.Replace(match, ",", ".", 1)
	return strconv.ParseFloat(normalized, 64)
}

// generateTicketQRCode creates a QR code PNG for the given ticket id, encodes it in base64, and returns the encoded string.
func generateTicketQRCode(ticketID string) (string, error) {
	// Create a QR code PNG file as byte slice; adjust size as needed (here using 256x256)
	png, err := qrcode.Encode(ticketID, qrcode.Medium, 256)
	if err != nil {
		return "", err
	}
	// Encode the PNG data to base64
	encoded := base64.StdEncoding.EncodeToString(png)
	return encoded, nil
}
