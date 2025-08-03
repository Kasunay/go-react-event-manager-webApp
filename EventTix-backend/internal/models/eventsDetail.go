package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

type EventDetails struct {
	ID              string         `json:"id"`
	CreatorID       string         `json:"creator_id"`
	Title           string         `json:"title"`
	Slug            string         `json:"slug"`
	Description     string         `json:"description,omitempty"`
	StartTime       time.Time      `json:"start_time"`
	LocationName    sql.NullString `json:"location_name,omitempty"`
	LocationAddress sql.NullString `json:"location_address,omitempty"`
	ImageURL        sql.NullString `json:"image_url,omitempty"`
	IsPublished     bool           `json:"is_published"`
	CreatedAt       *time.Time     `json:"created_at,omitempty"`
	UpdatedAt       *time.Time     `json:"updated_at,omitempty"`

	Categories  []Category   `json:"categories,omitempty"`
	TicketTypes []TicketType `json:"ticket_types,omitempty"`
}

type EventDetailsResponse struct {
	ID              string    `json:"id"`
	CreatorID       string    `json:"creator_id"`
	Title           string    `json:"title"`
	Slug            string    `json:"slug"`
	Description     string    `json:"description"`
	StartTime       time.Time `json:"start_time"`
	LocationName    *string   `json:"location_name"`
	LocationAddress *string   `json:"location_address"`
	ImageURL        *string   `json:"image_url"`
	IsPublished     bool      `json:"is_published"`
}

type Category struct {
	ID               int        `json:"id"`
	Name             string     `json:"name"`
	Slug             string     `json:"slug"`
	Description      *string    `json:"description,omitempty"`
	ParentCategoryID *int       `json:"parent_category_id,omitempty"`
	CreatedAt        *time.Time `json:"created_at,omitempty"`
}

type OrderSummary struct {
	ID               uuid.UUID `json:"id"`
	UserID           uuid.UUID `json:"user_id"`
	TotalAmountCents int       `json:"total_amount_cents"`
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"created_at"`
}
type OrderDetails struct {
	ID               uuid.UUID       `json:"id"`
	UserID           uuid.UUID       `json:"user_id"`
	TotalAmountCents int             `json:"total_amount_cents"`
	Status           string          `json:"status"`
	CreatedAt        time.Time       `json:"created_at"`
	Tickets          []TicketSummary `json:"tickets"`
}

type TicketSummary struct {
	ID         uuid.UUID `json:"id"`
	Code       string    `json:"code"`
	IsUsed     bool      `json:"is_used"`
	TypeName   string    `json:"type_name"`
	EventTitle string    `json:"event_title"`
}
