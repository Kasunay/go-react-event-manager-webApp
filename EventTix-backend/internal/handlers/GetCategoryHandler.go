package handlers

type Category struct {
	ID            int        `json:"id"`
	Name          string     `json:"name"`
	Slug          string     `json:"slug"`
	SubCategories []Category `json:"subCategories,omitempty"`
}

/* func GetNestedCategoriesHandler(db *sql.DB) http.HandlerFunc {
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
*/
