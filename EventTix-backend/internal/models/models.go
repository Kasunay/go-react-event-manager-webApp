// TickVibe-EventTix-backend/internal/models/models.go
package models

import (
	"time"
)

// User represents a user in the system (Essential for role-based access)
type User struct {
	ID              string     `json:"id"` // UUID
	Username        string     `json:"username"`
	Email           string     `json:"email"`
	PasswordHash    string     `json:"password_hash"`
	Role            string     `json:"role"` // e.g., "user", "admin", "creator"
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       *time.Time `json:"updated_at"`
	IsEmailVerified bool       `json:"is_email_verified"`
}

// Add other models (Category, TicketType, Order etc.) here if you have them.
