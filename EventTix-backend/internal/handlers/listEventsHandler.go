package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// EventResponse defines the JSON structure for each event
type EventResponse struct {
	ID              string    `json:"id"`
	Title           string    `json:"title"`
	Slug            string    `json:"slug"`
	Description     string    `json:"description"`
	StartTime       time.Time `json:"start_time"`
	LocationName    string    `json:"location_name"`
	LocationAddress string    `json:"location_address"`
	ImageURL        string    `json:"image_url"`
	CityID          int       `json:"city_id"`
	CityName        string    `json:"city_name"`
	VoivodeshipID   int       `json:"voivodeship_id"`
	VoivodeshipName string    `json:"voivodeship_name"`
	CategoryIDs     []int     `json:"category_ids"` // Note: This is still an empty slice in the scan loop
}

// PaginatedEventsResponse defines the JSON structure for paginated events
type PaginatedEventsResponse struct {
	Events     []EventResponse `json:"events"`
	Total      int             `json:"total"`
	Page       int             `json:"page"`
	PageSize   int             `json:"page_size"`
	TotalPages int             `json:"total_pages"`
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	log.Printf("Responding with error %d: %s", code, message)
	respondWithJSON(w, code, map[string]string{"error": message})
}

func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		log.Println("Error marshalling JSON response:", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error": "Internal server error"}`))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

func GetEventsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()

		cityIDStr := query.Get("city_id")
		voivodeshipIDStr := query.Get("voivodeship_id")
		startDateStr := query.Get("start_date")
		endDateStr := query.Get("end_date")
		categorySlug := query.Get("category_slug")
		parentCategorySlug := query.Get("parent_category_slug")
		searchText := query.Get("search")     // New: Search text parameter
		pageStr := query.Get("page")          // New: Page number parameter
		pageSizeStr := query.Get("page_size") // New: Page size parameter

		args := []interface{}{}
		argCounter := 1
		whereClauses := []string{"e.is_published = TRUE"}

		// Base SQL with joins
		sqlQuery := `
            SELECT
                e.id, e.title, e.slug, e.description, e.start_time,
                e.location_name, e.location_address, e.image_url,
                e.city_id, c.name AS city_name,
                v.id AS voivodeship_id, v.name AS voivodeship_name
            FROM events e
            JOIN cities c ON e.city_id = c.id
            JOIN voivodeships v ON c.voivodeship_id = v.id
        `

		// Handle category filters
		if categorySlug != "" || parentCategorySlug != "" {
			sqlQuery += `
                JOIN event_categories ec ON e.id = ec.event_id
                JOIN categories cat ON ec.category_id = cat.id
            `

			if categorySlug != "" && parentCategorySlug != "" {
				whereClauses = append(whereClauses, "cat.slug = $"+strconv.Itoa(argCounter))
				args = append(args, categorySlug)
				argCounter++

				whereClauses = append(whereClauses,
					"cat.parent_category_id = (SELECT id FROM categories WHERE slug = $"+strconv.Itoa(argCounter)+")")
				args = append(args, parentCategorySlug)
				argCounter++

			} else if parentCategorySlug != "" {
				whereClauses = append(whereClauses, "(cat.slug = $"+strconv.Itoa(argCounter)+
					" OR cat.parent_category_id = (SELECT id FROM categories WHERE slug = $"+strconv.Itoa(argCounter)+"))")
				args = append(args, parentCategorySlug)
				argCounter++

			} else if categorySlug != "" {
				whereClauses = append(whereClauses, "cat.slug = $"+strconv.Itoa(argCounter))
				args = append(args, categorySlug)
				argCounter++
			}
		}

		// City filter
		if cityIDStr != "" {
			cityID, err := strconv.Atoi(cityIDStr)
			if err != nil {
				respondWithError(w, http.StatusBadRequest, "Invalid city_id parameter")
				return
			}
			whereClauses = append(whereClauses, "e.city_id = $"+strconv.Itoa(argCounter))
			args = append(args, cityID)
			argCounter++
		}

		// Voivodeship filter (only if no city filter)
		if voivodeshipIDStr != "" && cityIDStr == "" {
			voivodeshipID, err := strconv.Atoi(voivodeshipIDStr)
			if err != nil {
				respondWithError(w, http.StatusBadRequest, "Invalid voivodeship_id parameter")
				return
			}
			whereClauses = append(whereClauses, "c.voivodeship_id = $"+strconv.Itoa(argCounter))
			args = append(args, voivodeshipID)
			argCounter++
		}

		// New: Text search filter
		if searchText != "" {
			// Using ILIKE for case-insensitive search
			searchPattern := "%" + strings.ToLower(searchText) + "%"
			whereClauses = append(whereClauses, "(LOWER(e.title) LIKE $"+strconv.Itoa(argCounter)+" OR LOWER(e.description) LIKE $"+strconv.Itoa(argCounter)+")")
			args = append(args, searchPattern)
			argCounter++
		}

		// Date filters
		var startDate, endDate time.Time
		startProvided := false
		endProvided := false

		if startDateStr != "" {
			var err error
			startDate, err = time.Parse(time.RFC3339Nano, startDateStr)
			if err != nil {
				respondWithError(w, http.StatusBadRequest, "Invalid start_date format. Use ISO 8601.")
				return
			}
			startProvided = true
		}

		if endDateStr != "" {
			var err error
			endDate, err = time.Parse(time.RFC3339Nano, endDateStr)
			if err != nil {
				respondWithError(w, http.StatusBadRequest, "Invalid end_date format. Use ISO 8601.")
				return
			}
			if endDate.Hour() == 0 && endDate.Minute() == 0 && endDate.Second() == 0 {
				endDate = endDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second + 999*time.Millisecond)
			}
			endProvided = true
		}

		if startProvided && endProvided {
			whereClauses = append(whereClauses, "e.start_time BETWEEN $"+strconv.Itoa(argCounter)+" AND $"+strconv.Itoa(argCounter+1))
			args = append(args, startDate, endDate)
			argCounter += 2
		} else if startProvided {
			whereClauses = append(whereClauses, "e.start_time >= $"+strconv.Itoa(argCounter))
			args = append(args, startDate)
			argCounter++
		} else if endProvided {
			whereClauses = append(whereClauses, "e.start_time <= $"+strconv.Itoa(argCounter))
			args = append(args, endDate)
			argCounter++
		} else {
			whereClauses = append(whereClauses, "e.start_time >= NOW()")
		}

		// Final query assembly for WHERE clause
		if len(whereClauses) > 0 {
			sqlQuery += " WHERE " + strings.Join(whereClauses, " AND ")
		}

		// --- Pagination ---
		page := 1
		if pageStr != "" {
			p, err := strconv.Atoi(pageStr)
			if err != nil || p < 1 {
				respondWithError(w, http.StatusBadRequest, "Invalid page parameter. Must be a positive integer.")
				return
			}
			page = p
		}

		pageSize := 10 // Default page size
		if pageSizeStr != "" {
			ps, err := strconv.Atoi(pageSizeStr)
			if err != nil || ps < 1 {
				respondWithError(w, http.StatusBadRequest, "Invalid page_size parameter. Must be a positive integer.")
				return
			}
			pageSize = ps
		}

		offset := (page - 1) * pageSize

		// First, get the total count of events matching the criteria
		countQuery := `SELECT COUNT(DISTINCT e.id) FROM events e
                      JOIN cities c ON e.city_id = c.id
                      JOIN voivodeships v ON c.voivodeship_id = v.id`

		// Add category joins to count query if they were added to the main query
		if categorySlug != "" || parentCategorySlug != "" {
			countQuery += `
                JOIN event_categories ec ON e.id = ec.event_id
                JOIN categories cat ON ec.category_id = cat.id
            `
		}
		if len(whereClauses) > 0 {
			countQuery += " WHERE " + strings.Join(whereClauses, " AND ")
		}

		var totalEvents int
		// Pass a copy of args for the count query to avoid issues with modifying the slice for the main query
		// This is important because the main query will append OFFSET and LIMIT args.
		countArgs := make([]interface{}, len(args))
		copy(countArgs, args)

		err := db.QueryRow(countQuery, countArgs...).Scan(&totalEvents)
		if err != nil {
			log.Println("Error counting events:", err)
			respondWithError(w, http.StatusInternalServerError, "Failed to retrieve event count")
			return
		}

		// Add ORDER BY, LIMIT, and OFFSET for the main query
		sqlQuery += " ORDER BY e.start_time ASC LIMIT $" + strconv.Itoa(argCounter) + " OFFSET $" + strconv.Itoa(argCounter+1)
		args = append(args, pageSize, offset)
		argCounter += 2 // Increment argCounter for LIMIT and OFFSET

		// Log the final query and arguments for debugging
		log.Printf("SQL Query: %s\nArgs: %v", sqlQuery, args)

		rows, err := db.Query(sqlQuery, args...)
		if err != nil {
			log.Println("Error querying events:", err)
			respondWithError(w, http.StatusInternalServerError, "Failed to retrieve events")
			return
		}
		defer rows.Close()

		events := []EventResponse{}
		for rows.Next() {
			var e EventResponse
			err := rows.Scan(
				&e.ID, &e.Title, &e.Slug, &e.Description, &e.StartTime,
				&e.LocationName, &e.LocationAddress, &e.ImageURL,
				&e.CityID, &e.CityName, &e.VoivodeshipID, &e.VoivodeshipName,
			)
			if err != nil {
				log.Println("Error scanning row:", err)
				continue
			}

			// Fetch category IDs for the current event
			var categoryIDs []int
			categoryRows, catErr := db.Query(`SELECT category_id FROM event_categories WHERE event_id = $1`, e.ID)
			if catErr != nil {
				log.Printf("Error fetching category IDs for event %s: %v", e.ID, catErr)
				// Depending on requirements, you might choose to continue with empty category IDs
			} else {
				for categoryRows.Next() {
					var catID int
					if err := categoryRows.Scan(&catID); err == nil {
						categoryIDs = append(categoryIDs, catID)
					} else {
						log.Printf("Error scanning category ID for event %s: %v", e.ID, err)
					}
				}
				categoryRows.Close() // Ensure rows are closed
			}
			e.CategoryIDs = categoryIDs
			events = append(events, e)
		}

		if err = rows.Err(); err != nil {
			log.Println("Row iteration error:", err)
			respondWithError(w, http.StatusInternalServerError, "Failed to retrieve events")
			return
		}

		totalPages := (totalEvents + pageSize - 1) / pageSize
		if totalPages == 0 && totalEvents > 0 { // Ensure at least 1 page if there are results
			totalPages = 1
		} else if totalEvents == 0 {
			totalPages = 0
		}

		responsePayload := PaginatedEventsResponse{
			Events:     events,
			Total:      totalEvents,
			Page:       page,
			PageSize:   pageSize,
			TotalPages: totalPages,
		}

		respondWithJSON(w, http.StatusOK, responsePayload)
	}
}

func GetNestedCategoriesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Fetch parent categories
		parentsRows, err := db.Query(`
            SELECT id, name, slug
            FROM categories
            WHERE parent_category_id IS NULL
            ORDER BY name ASC
        `)
		if err != nil {
			log.Println("Error fetching parent categories:", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		defer parentsRows.Close()

		var categories []Category

		for parentsRows.Next() {
			var parent Category
			if err := parentsRows.Scan(&parent.ID, &parent.Name, &parent.Slug); err != nil {
				log.Println("Error scanning parent category:", err)
				continue
			}

			// Fetch subcategories for this parent
			subRows, err := db.Query(`
                SELECT id, name, slug
                FROM categories
                WHERE parent_category_id = $1
                ORDER BY name ASC
            `, parent.ID)
			if err != nil {
				log.Println("Error fetching subcategories:", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}

			var subs []Category
			for subRows.Next() {
				var sub Category
				if err := subRows.Scan(&sub.ID, &sub.Name, &sub.Slug); err != nil {
					log.Println("Error scanning subcategory:", err)
					continue
				}
				subs = append(subs, sub)
			}
			subRows.Close()

			parent.SubCategories = subs
			categories = append(categories, parent)
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(categories); err != nil {
			log.Println("Error encoding categories JSON:", err)
		}
	}
}
