package models

import (
	"time"

	"github.com/google/uuid"
)

type AdminTicketInfo struct {
	ID             uuid.UUID `json:"id"`
	OrderID        uuid.UUID `json:"order_id"`
	TicketTypeID   int       `json:"ticket_type_id"`
	Code           string    `json:"ticket_code"`
	Status         bool      `json:"is_used"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"` // Only admin
	UserEmail      string    `json:"user_email"` // Only admin
	EventTitle     string    `json:"event_title"`
	TicketTypeName string    `json:"ticket_type_name"`
}

type UserTicketInfo struct {
	ID             uuid.UUID `json:"id"`
	OrderID        uuid.UUID `json:"order_id"`
	TicketTypeID   int       `json:"ticket_type_id"`
	Code           string    `json:"ticket_code"`
	Status         bool      `json:"is_used"`
	CreatedAt      time.Time `json:"created_at"`
	EventTitle     string    `json:"event_title"`
	TicketTypeName string    `json:"ticket_type_name"`
}
