package utils

import (
	"TickVibe-EventTix-backend/internal/models"
	"errors"
	"time"
)

func ValidateEventInput(title, slug string, ticketTypes []models.TicketTypeIn, start time.Time) error {
	if title == "" || slug == "" || len(ticketTypes) == 0 {
		return errors.New("title, slug, and at least one ticket type are required")
	}

	if start.Before(time.Now()) {
		return errors.New("event start time cannot be in the past")
	}

	for _, tt := range ticketTypes {
		if tt.PriceCents < 0 || tt.TotalQuantity <= 0 {
			return errors.New("ticket types must have non-negative price and positive quantity")
		}
	}

	return nil
}
