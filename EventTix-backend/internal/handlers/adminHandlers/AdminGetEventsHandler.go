package adminHandlers

import (
	"TickVibe-EventTix-backend/internal/middleware"
	"TickVibe-EventTix-backend/internal/models"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(payload)
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]string{"error": message})
}

// ptrToString converts a *string to string for sql.NullString (handles nil)
func ptrToString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func AdminCreatorListEventsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := middleware.GetUserFromContext(r)
		if !ok {
			log.Println("User not found in context")
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		log.Printf("User: %+v\n", claims)
		query := `
			SELECT e.id, e.title, e.slug, e.start_time,
	        e.created_at, e.updated_at, is_published
			FROM events e
			WHERE 1=1
		`
		args := []interface{}{}
		i := 1

		// Creators only see their own events
		if claims.Role == "creator" {
			if claims.UserID == "" {
				log.Println("Creator ID is empty")
				http.Error(w, "Invalid user ID", http.StatusBadRequest)
				return
			}
			query += fmt.Sprintf(" AND e.creator_id = $%d", i)
			args = append(args, claims.UserID)
			i++
		}

		// Optional filters
		if search := r.URL.Query().Get("search"); search != "" {
			query += fmt.Sprintf(" AND (LOWER(e.title) LIKE LOWER($%d) OR LOWER(e.description) LIKE LOWER($%d))", i, i)
			args = append(args, "%"+search+"%")
			i++
		}

		query += " ORDER BY e.start_time ASC"

		rows, err := db.Query(query, args...)
		if err != nil {
			log.Println("DB query error:", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var events []models.EventSummary
		for rows.Next() {
			var e models.EventSummary

			if err := rows.Scan(&e.ID, &e.Title, &e.Slug,
				&e.StartTime, &e.CreatedAt, &e.UpdatedAt, &e.IsPublished); err != nil {
				log.Println("Scan error:", err)
				continue
			}
			events = append(events, e)
		}

		respondWithJSON(w, http.StatusOK, events)

	}
}

func AdminCreatorGetEventBySlugHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := r.PathValue("slug")

		claims, ok := middleware.GetUserFromContext(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		query := `
            SELECT id, creator_id, title, slug, description, start_time,
                   location_name, location_address, image_url, is_published
            FROM events WHERE slug = $1
        `
		var e models.EventDetails

		err := db.QueryRow(query, slug).Scan(
			&e.ID, &e.CreatorID, &e.Title, &e.Slug, &e.Description,
			&e.StartTime, &e.LocationName, &e.LocationAddress,
			&e.ImageURL, &e.IsPublished,
		)
		if err != nil {
			log.Println("Error fetching event by slug:", err)
			http.Error(w, "Event not found", http.StatusNotFound)
			return
		}

		resp := models.EventDetailsResponse{
			ID:          e.ID,
			CreatorID:   e.CreatorID,
			Title:       e.Title,
			Slug:        e.Slug,
			Description: e.Description,
			StartTime:   e.StartTime,
			IsPublished: e.IsPublished,
		}

		if e.LocationName.Valid {
			resp.LocationName = &e.LocationName.String
		}
		if e.LocationAddress.Valid {
			resp.LocationAddress = &e.LocationAddress.String
		}
		if e.ImageURL.Valid {
			resp.ImageURL = &e.ImageURL.String
		}

		// Only allow creators to see their own events
		if claims.Role == "creator" && claims.UserID != e.CreatorID {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}

		respondWithJSON(w, http.StatusOK, resp)
	}
}
