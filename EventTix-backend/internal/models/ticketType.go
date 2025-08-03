package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

type TicketType struct {
	ID                int            `db:"id"`
	EventID           uuid.UUID      `db:"event_id"`
	Name              string         `db:"name"`
	Description       sql.NullString `db:"description"`
	PriceCents        int            `db:"price_cents"`
	TotalQuantity     int            `db:"total_quantity"`
	AvailableQuantity int            `db:"available_quantity"`
	CreatedAt         time.Time      `db:"created_at"`
	UpdatedAt         sql.NullTime   `db:"updated_at"`
}

type TicketTypeIn struct {
	Name          string  `json:"name"`
	Description   *string `json:"description"` // allows null
	PriceCents    int     `json:"price_cents"`
	TotalQuantity int     `json:"total_quantity"`
}
