package adminHandlers

import (
	"TickVibe-EventTix-backend/internal/middleware"
	"TickVibe-EventTix-backend/internal/models"
	"TickVibe-EventTix-backend/internal/utils"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
)

func AdminCreatorUpdateEventHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := middleware.GetUserFromContext(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		eventID := r.PathValue("id")
		if eventID == "" {
			respondWithError(w, http.StatusBadRequest, "Event ID is required")
			return
		}

		eventIDParsed, err := uuid.Parse(eventID)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid Event ID")
			return
		}

		if claims.Role == "creator" {
			var count int
			err := db.QueryRow(`SELECT COUNT(*) FROM events WHERE id = $1 AND creator_id = $2`, eventIDParsed, claims.UserID).Scan(&count)
			if err != nil || count == 0 {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
		}

		var updatedEvent models.Event
		err = json.NewDecoder(r.Body).Decode(&updatedEvent)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid request payload")
			return
		}

		// Fetch the current image URL from the database
		var currentImagePath string
		err = db.QueryRow("SELECT image_url FROM events WHERE id = $1", eventIDParsed).Scan(&currentImagePath)
		if err != nil {
			log.Println("Error fetching current image:", err)
			respondWithError(w, http.StatusInternalServerError, "Failed to retrieve event data")
			return
		}

		// Handle new image replacement if provided
		imagePathToSave := currentImagePath
		if updatedEvent.ImageURL != nil && strings.HasPrefix(*updatedEvent.ImageURL, "data:image/") {
			decodedImage, err := utils.DecodeAndValidateBase64Image(*updatedEvent.ImageURL)
			if err != nil {
				respondWithError(w, http.StatusBadRequest, "Invalid image format")
				return
			}

			// Delete the old image file if it exists
			if currentImagePath != "" {
				if err := os.Remove(currentImagePath); err != nil && !errors.Is(err, os.ErrNotExist) {
					log.Printf("Failed to remove old image: %v", err)
				}
			}

			// Save the new image
			imageDir := os.Getenv("IMAGE_UPLOAD_DIR")
			if imageDir == "" {
				imageDir = "./images"
			}

			newImagePath, err := utils.SaveImage(decodedImage, imageDir, eventIDParsed.String()+".png")
			if err != nil {
				log.Println("Image save failed:", err)
				respondWithError(w, http.StatusInternalServerError, "Failed to save new event image")
				return
			}

			imagePathToSave = newImagePath
		}

		currentTime := time.Now().UTC()
		result, err := db.Exec(`UPDATE events SET
			title = $1, slug = $2, description = $3, start_time = $4, 
			location_name = $5, location_address = $6, image_url = $7, is_published = $8, updated_at = $9
			WHERE id = $10`,
			updatedEvent.Title, updatedEvent.Slug, updatedEvent.Description,
			updatedEvent.StartTime,
			sql.NullString{String: ptrToString(updatedEvent.LocationName), Valid: updatedEvent.LocationName != nil},
			sql.NullString{String: ptrToString(updatedEvent.LocationAddress), Valid: updatedEvent.LocationAddress != nil},
			sql.NullString{String: imagePathToSave, Valid: imagePathToSave != ""},
			updatedEvent.IsPublished, currentTime, eventIDParsed,
		)
		if err != nil {
			if strings.Contains(err.Error(), "duplicate key value violates unique constraint") {
				var currentSlug string
				errCheckSlug := db.QueryRow("SELECT slug FROM events WHERE id = $1", eventIDParsed).Scan(&currentSlug)
				if errCheckSlug == nil && currentSlug != updatedEvent.Slug {
					respondWithError(w, http.StatusConflict, "Event slug already exists")
					return
				}
			}
			log.Printf("Error updating event: %v", err)
			respondWithError(w, http.StatusInternalServerError, "Failed to update event")
			return
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil || rowsAffected == 0 {
			respondWithError(w, http.StatusNotFound, "Event not found or no changes made")
			return
		}

		respondWithJSON(w, http.StatusOK, map[string]string{"message": "Event updated successfully"})
	}
}
