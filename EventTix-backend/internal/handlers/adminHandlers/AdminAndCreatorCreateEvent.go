package adminHandlers

import (
	"TickVibe-EventTix-backend/internal/middleware"
	"TickVibe-EventTix-backend/internal/models"
	"TickVibe-EventTix-backend/internal/utils"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
)

type CreateEventRequest struct {
	Title           string                `json:"title"`
	Slug            string                `json:"slug"`
	Description     string                `json:"description"`
	StartTime       time.Time             `json:"start_time"`
	LocationName    string                `json:"location_name"`
	LocationAddress string                `json:"location_address"`
	ImageURL        string                `json:"image_url"`
	IsPublished     bool                  `json:"is_published"`
	CityID          int                   `json:"city_id"`
	CategoryIDs     []int                 `json:"category_ids"`
	TicketTypes     []models.TicketTypeIn `json:"ticket_types"`
}

func AdminAndCreatorCreateEventHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, _ := middleware.GetUserFromContext(r)
		userID := claims.UserID

		var req CreateEventRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Println("Error decoding JSON:", err)
			respondWithError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		// Validate input
		if err := utils.ValidateEventInput(req.Title, req.Slug, req.TicketTypes, req.StartTime); err != nil {
			log.Println("Input validation failed:", err)
			respondWithError(w, http.StatusBadRequest, "Invalid event input")
			return
		}

		// Validate CityID exists
		var cityExists bool
		err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM cities WHERE id = $1)", req.CityID).Scan(&cityExists)
		if err != nil {
			log.Println("Error checking city:", err)
			respondWithError(w, http.StatusInternalServerError, "Internal error")
			return
		}
		if !cityExists {
			respondWithError(w, http.StatusBadRequest, "Invalid city_id")
			return
		}

		// Check for slug uniqueness
		var slugExists bool
		err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM events WHERE slug = $1)", req.Slug).Scan(&slugExists)
		if err != nil {
			log.Println("Error checking slug:", err)
			respondWithError(w, http.StatusInternalServerError, "Internal error")
			return
		}
		if slugExists {
			respondWithError(w, http.StatusBadRequest, "Slug already exists")
			return
		}

		// Decode and validate image
		decodedImage, err := utils.DecodeAndValidateBase64Image(req.ImageURL)
		if err != nil {
			log.Println("Image decoding failed:", err)
			respondWithError(w, http.StatusBadRequest, "Invalid image format")
			return
		}

		tx, err := db.Begin()
		if err != nil {
			log.Println("Transaction start error:", err)
			respondWithError(w, http.StatusInternalServerError, "Internal error")
			return
		}
		defer tx.Rollback()

		eventID := uuid.New()
		imageDir := os.Getenv("IMAGE_UPLOAD_DIR")
		if imageDir == "" {
			imageDir = "./images"
		}

		imagePath, err := utils.SaveImage(decodedImage, imageDir, eventID.String()+".png")
		if err != nil {
			log.Println("Image save failed:", err)
			respondWithError(w, http.StatusInternalServerError, "Failed to save event image")
			return
		}

		_, err = tx.Exec(`
			INSERT INTO events (
				id, creator_id, title, slug, description, start_time,
				location_name, location_address, image_url, is_published, city_id
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
			eventID, userID, req.Title, req.Slug, req.Description, req.StartTime,
			req.LocationName, req.LocationAddress, imagePath, req.IsPublished, req.CityID,
		)
		if err != nil {
			log.Println("Event insert failed:", err)
			respondWithError(w, http.StatusInternalServerError, "Failed to create event")
			return
		}

		// Insert categories
		for _, cid := range req.CategoryIDs {
			_, err := tx.Exec(`INSERT INTO event_categories (event_id, category_id) VALUES ($1, $2)`, eventID, cid)
			if err != nil {
				log.Println("Category insert failed:", err)
				respondWithError(w, http.StatusInternalServerError, "Failed to link event categories")
				return
			}
		}

		// Insert ticket types
		for _, tt := range req.TicketTypes {
			_, err := tx.Exec(`
				INSERT INTO ticket_types (
					event_id, name, description, price_cents, total_quantity, available_quantity
				) VALUES ($1, $2, $3, $4, $5, $5)`,
				eventID, tt.Name, tt.Description, tt.PriceCents, tt.TotalQuantity,
			)
			if err != nil {
				log.Println("Ticket insert failed:", err)
				respondWithError(w, http.StatusInternalServerError, "Failed to create ticket types")
				return
			}
		}

		if err := tx.Commit(); err != nil {
			log.Println("Transaction commit failed:", err)
			respondWithError(w, http.StatusInternalServerError, "Failed to save event")
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":  "Event created successfully",
			"event_id": eventID,
		})
	}
}
