package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

type TicketType struct {
	Id                int    `json:"id"`
	Name              string `json:"name"`
	Description       string `json:"description,omitempty"`
	PriceCents        int    `json:"price_cents"`
	TotalQuantity     int    `json:"total_quantity"`
	AvailableQuantity int    `json:"available_quantity"`
}

type EventDetail struct {
	ID              string       `json:"id"`
	Title           string       `json:"title"`
	Slug            string       `json:"slug"`
	Description     string       `json:"description,omitempty"`
	CityID          int          `json:"city_id"`
	CityName        string       `json:"city_name"`
	VoivodeshipName string       `json:"voivodeship_name"`
	StartTime       string       `json:"start_time"`
	LocationName    string       `json:"location_name"`
	ImageURL        string       `json:"image_url,omitempty"`
	CategorySlugs   []string     `json:"category_slugs,omitempty"`
	TicketTypes     []TicketType `json:"ticket_types,omitempty"`
}

func GetEventBySlugHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := strings.TrimPrefix(r.URL.Path, "/api/events/") // crude slug extract
		if slug == "" {
			http.Error(w, "Missing slug", http.StatusBadRequest)
			return
		}

		// Fetch event details
		var event EventDetail
		err := db.QueryRow(`
			SELECT 
			e.id, e.title, e.slug, e.description, e.start_time, e.location_name, e.image_url,
			e.city_id, c.name AS city_name, v.name AS voivodeship_name
			FROM events e
			LEFT JOIN cities c ON e.city_id = c.id
			LEFT JOIN voivodeships v ON c.voivodeship_id = v.id
			WHERE e.slug = $1 AND e.is_published = TRUE
			`, slug).Scan(
			&event.ID, &event.Title, &event.Slug, &event.Description,
			&event.StartTime, &event.LocationName, &event.ImageURL,
			&event.CityID, &event.CityName, &event.VoivodeshipName,
		)

		if err == sql.ErrNoRows {
			http.Error(w, "Event not found", http.StatusNotFound)
			return
		} else if err != nil {
			log.Println("DB error:", err)
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}

		// Fetch ticket types
		rows, err := db.Query(`
			SELECT id, name, description, price_cents, total_quantity, available_quantity
			FROM ticket_types
			WHERE event_id = $1
		`, event.ID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var t TicketType
				if err := rows.Scan(&t.Id, &t.Name, &t.Description, &t.PriceCents, &t.TotalQuantity, &t.AvailableQuantity); err == nil {
					event.TicketTypes = append(event.TicketTypes, t)
				}
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(event)
	}
}
