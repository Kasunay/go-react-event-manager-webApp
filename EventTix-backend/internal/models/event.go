package models

import "time"

type Event struct {
	ID              string     `json:"id"` // UUID
	Title           string     `json:"title"`
	Slug            string     `json:"slug"`
	Description     string     `json:"description"`
	StartTime       time.Time  `json:"start_time"`
	LocationName    *string    `json:"location_name"`    // Pointer to allow NULL in DB
	LocationAddress *string    `json:"location_address"` // Pointer to allow NULL in DB
	ImageURL        *string    `json:"image_url"`        // Pointer to allow NULL in DB
	IsPublished     bool       `json:"is_published"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       *time.Time `json:"updated_at"` // Pointer to allow NULL in DB
}

// In internal/adminHandlers or internal/models
type UpdateEventRequest struct {
	Title           string               `json:"title"`
	Slug            string               `json:"slug"`
	Description     string               `json:"description"`
	StartTime       time.Time            `json:"start_time"`
	LocationName    *string              `json:"location_name"`    // Use pointer for optional/nullable fields
	LocationAddress *string              `json:"location_address"` // Use pointer for optional/nullable fields
	ImageURL        *string              `json:"image_url"`        // Use pointer for optional/nullable fields (can be nil, empty string, or base64)
	IsPublished     bool                 `json:"is_published"`
	CityID          int                  `json:"city_id"`
	CategoryIDs     []int                `json:"category_ids"`
	TicketTypes     []TicketTypeUpdateIn `json:"ticket_types"` // Reference the struct below
} // In internal/models (recommended)
type TicketTypeUpdateIn struct {
	ID            *int    `json:"id,omitempty"` // Pointer + omitempty means it's optional in JSON
	Name          string  `json:"name"`
	Description   *string `json:"description"` // Description can be optional/nullable
	PriceCents    int     `json:"price_cents"`
	TotalQuantity int     `json:"total_quantity"`
	// Note: AvailableQuantity is calculated on the server side, not sent by the client
}
