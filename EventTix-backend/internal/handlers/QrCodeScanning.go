package handlers

import (
	"TickVibe-EventTix-backend/internal/utils"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

// qrcodeReq represents the structure of the incoming QR code request.
type qrcodeReq struct {
	QRCode string `json:"img"` // Assuming the QR code string is sent in a field named 'img'
}

// scanResponse defines the structure for the response sent to the frontend after scanning.
type scanResponse struct {
	Exists   bool    `json:"exists"`
	Message  string  `json:"message"`
	TicketID *string `json:"ticketId,omitempty"` // Changed to *string to hold the UUID
	IsUsed   *bool   `json:"isUsed,omitempty"`   // Added to indicate if the ticket is already used
}

// validateRequest defines the structure for the incoming validation request.
type validateRequest struct {
	TicketID string `json:"ticketId"` // The UUID of the ticket to validate
}

// QrCodeScanning handles the QR code scanning logic.
// It checks if the provided QR code (which is the ticket ID, a UUID string) exists
// in the 'tickets' table and returns its current 'is_used' status.
func QrCodeScanning(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req qrcodeReq
		// Decode the JSON request body into the qrcodeReq struct.
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			utils.WriteJSONError(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Log the received QR code for debugging purposes.
		fmt.Printf("Received QR Code for scanning (expected Ticket ID/UUID): %s\n", req.QRCode)

		// SQL query to check if the ticket_id exists and retrieve its 'is_used' status.
		// IMPORTANT: Ensure your 'ticket_id' column is of a type that can store UUID strings
		// and 'is_used' is a BOOLEAN type.
		query := `SELECT id, is_used FROM tickets WHERE id = $1` // Use $1 for PostgreSQL, ? for MySQL/SQLite

		var foundTicketID string
		var isUsed bool
		// Execute the query. QueryRow is used when you expect at most one row.
		err := db.QueryRow(query, req.QRCode).Scan(&foundTicketID, &isUsed)

		if err != nil {
			if err == sql.ErrNoRows {
				// QR code (ticket ID/UUID) not found in the database.
				fmt.Printf("Ticket ID '%s' from QR Code not found.\n", req.QRCode)
				resp := scanResponse{
					Exists:  false,
					Message: fmt.Sprintf("Ticket with ID %s not found.", req.QRCode),
				}
				utils.WriteJSON(w, http.StatusOK, resp) // Use http.StatusOK even for "not found" as it's a valid outcome
				return
			}
			// Other database error.
			fmt.Printf("Database error during QR code scan for Ticket ID %s: %v\n", req.QRCode, err)
			utils.WriteJSONError(w, "Database error during QR code scan", http.StatusInternalServerError)
			return
		}

		// If we reach here, the ticket ID (UUID) was found.
		fmt.Printf("Ticket ID '%s' from QR Code found. Is Used: %t\n", foundTicketID, isUsed)
		resp := scanResponse{
			Exists:   true,
			Message:  "Ticket found successfully!",
			TicketID: &foundTicketID,
			IsUsed:   &isUsed, // Include the 'isUsed' status in the response
		}
		utils.WriteJSON(w, http.StatusOK, resp)
	}
}

// ValidateTicket handles the request to mark a ticket as used.
func ValidateTicket(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req validateRequest
		// Decode the JSON request body into the validateRequest struct.
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			utils.WriteJSONError(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Log the received ticket ID for validation.
		fmt.Printf("Received Ticket ID for validation: %s\n", req.TicketID)

		// First, check the current status of the ticket.
		var currentIsUsed bool
		checkQuery := `SELECT is_used FROM tickets WHERE id = $1`
		err := db.QueryRow(checkQuery, req.TicketID).Scan(&currentIsUsed)

		if err != nil {
			if err == sql.ErrNoRows {
				// Ticket not found.
				fmt.Printf("Validation failed: Ticket ID '%s' not found.\n", req.TicketID)
				utils.WriteJSONError(w, fmt.Sprintf("Ticket with ID %s not found.", req.TicketID), http.StatusNotFound)
				return
			}
			// Other database error.
			fmt.Printf("Database error checking ticket status for ID %s: %v\n", req.TicketID, err)
			utils.WriteJSONError(w, "Database error checking ticket status", http.StatusInternalServerError)
			return
		}

		if currentIsUsed {
			// Ticket is already used.
			fmt.Printf("Validation failed: Ticket ID '%s' is already used.\n", req.TicketID)
			utils.WriteJSONError(w, "Ticket is already used.", http.StatusConflict) // 409 Conflict is appropriate
			return
		}

		// If the ticket exists and is not used, proceed to update its status.
		updateQuery := `UPDATE tickets SET is_used = TRUE WHERE id = $1`
		_, err = db.Exec(updateQuery, req.TicketID)

		if err != nil {
			fmt.Printf("Database error updating ticket status for ID %s: %v\n", req.TicketID, err)
			utils.WriteJSONError(w, "Database error updating ticket status", http.StatusInternalServerError)
			return
		}

		// Ticket successfully validated.
		fmt.Printf("Ticket ID '%s' successfully validated (marked as used).\n", req.TicketID)
		utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "Ticket validated successfully!"})
	}
}
