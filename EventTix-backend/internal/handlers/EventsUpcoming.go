package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
)

type UpComingEvent struct {
	ID              string    `json:"id"`
	Title           string    `json:"title"`
	Slug            string    `json:"slug"`
	Description     string    `json:"description,omitempty"`
	StartTime       time.Time `json:"start_time"`
	LocationName    string    `json:"location_name,omitempty"`
	LocationAddress string    `json:"location_address,omitempty"`
	ImageURL        string    `json:"image_url,omitempty"`
	IsPublished     bool      `json:"is_published"`
	CreatedAt       time.Time `json:"created_at"`
}

func GetUpcomingEventsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := `
			SELECT id, title, slug, description, start_time,
			       location_name, location_address, image_url, is_published, created_at
			FROM events
			WHERE start_time >= NOW()
			ORDER BY start_time ASC
			LIMIT 10;
		`

		rows, err := db.Query(query)
		if err != nil {
			http.Error(w, "Failed to fetch upcoming events", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var events []UpComingEvent

		for rows.Next() {
			var e UpComingEvent
			err := rows.Scan(
				&e.ID, &e.Title, &e.Slug, &e.Description,
				&e.StartTime, &e.LocationName, &e.LocationAddress,
				&e.ImageURL, &e.IsPublished, &e.CreatedAt,
			)
			if err != nil {
				http.Error(w, "Error scanning event", http.StatusInternalServerError)
				return
			}
			events = append(events, e)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(events)
	}
}
