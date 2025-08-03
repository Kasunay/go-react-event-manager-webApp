package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type City struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type VoivodeshipWithCities struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Cities []City `json:"cities"`
}

func GetVoivodeshipsWithCities(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := `
			SELECT 
				v.id AS voivodeship_id,
				v.name AS voivodeship_name,
				c.id AS city_id,
				c.name AS city_name
			FROM voivodeships v
			LEFT JOIN cities c ON c.voivodeship_id = v.id
			ORDER BY v.name, c.name
		`

		rows, err := db.Query(query)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		voivodeshipMap := make(map[int]*VoivodeshipWithCities)

		for rows.Next() {
			var vID int
			var vName string
			var cID sql.NullInt64
			var cName sql.NullString

			if err := rows.Scan(&vID, &vName, &cID, &cName); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			if _, exists := voivodeshipMap[vID]; !exists {
				voivodeshipMap[vID] = &VoivodeshipWithCities{
					ID:     vID,
					Name:   vName,
					Cities: []City{},
				}
			}

			if cID.Valid && cName.Valid {
				voivodeshipMap[vID].Cities = append(voivodeshipMap[vID].Cities, City{
					ID:   int(cID.Int64),
					Name: cName.String,
				})
			}
		}

		var result []VoivodeshipWithCities
		for _, v := range voivodeshipMap {
			result = append(result, *v)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
	}
}
