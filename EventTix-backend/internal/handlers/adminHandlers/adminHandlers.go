package adminHandlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"TickVibe-EventTix-backend/internal/models" // Import your models

	"golang.org/x/crypto/bcrypt"
	// No need for UUID here as we're not creating users via this admin handler
)

// Helper functions for JSON responses (consider moving to a common utility package)
// Keeping them here for now if you haven't moved them

// AdminGetUsersHandler fetches all users for admin view.
func AdminGetUsersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query(`SELECT
			id, username, email, role, created_at, updated_at, is_email_verified
			FROM users ORDER BY created_at DESC`)
		if err != nil {
			log.Printf("Error getting users for admin: %v", err)
			respondWithError(w, http.StatusInternalServerError, "Failed to retrieve users")
			return
		}
		defer rows.Close()

		users := []models.User{}
		for rows.Next() {
			var u models.User
			var updatedAt sql.NullTime // For nullable updated_at

			err := rows.Scan(
				&u.ID, &u.Username, &u.Email, &u.Role, &u.CreatedAt, &updatedAt, &u.IsEmailVerified,
			)
			if err != nil {
				log.Printf("Error scanning admin user row: %v", err)
				continue
			}

			if updatedAt.Valid {
				u.UpdatedAt = &updatedAt.Time
			}

			users = append(users, u)
		}

		if err = rows.Err(); err != nil {
			log.Printf("Error iterating admin user rows: %v", err)
			respondWithError(w, http.StatusInternalServerError, "Failed to retrieve users (row iteration error)")
			return
		}

		respondWithJSON(w, http.StatusOK, users)
	}
}

func AdminAddUserHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		type requestPayload struct {
			Username        string `json:"username"`
			Email           string `json:"email"`
			Password        string `json:"password"`
			Role            string `json:"role"`
			IsEmailVerified bool   `json:"is_email_verified"`
		}

		var payload requestPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			log.Printf("Invalid JSON for new user: %v", err)
			respondWithError(w, http.StatusBadRequest, "Invalid request payload")
			return
		}

		if payload.Email == "" || payload.Password == "" || payload.Username == "" {
			respondWithError(w, http.StatusBadRequest, "Email, username, and password are required")
			return
		}

		allowedRoles := map[string]bool{"user": true, "admin": true, "creator": true}
		if !allowedRoles[payload.Role] {
			respondWithError(w, http.StatusBadRequest, "Invalid role specified")
			return
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Error hashing password: %v", err)
			respondWithError(w, http.StatusInternalServerError, "Failed to process password")
			return
		}

		query := `
			INSERT INTO users (username, email, password_hash, role, is_email_verified, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		`

		_, err = db.Exec(query, payload.Username, payload.Email, hashedPassword, payload.Role, payload.IsEmailVerified)
		if err != nil {
			log.Printf("Error inserting new user: %v", err)
			respondWithError(w, http.StatusInternalServerError, "Failed to create user")
			return
		}

		respondWithJSON(w, http.StatusCreated, map[string]string{"message": "User created successfully"})
	}
}

// AdminUpdateUserRoleHandler updates a user's role by ID.
func AdminUpdateUserHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		type requestPayload struct {
			ID              string `json:"id"`
			Email           string `json:"email"`
			FullName        string `json:"full_name"`
			Role            string `json:"role"`
			Password        string `json:"password,omitempty"`
			IsEmailVerified *bool  `json:"isEmailVerified"`
		}

		var payload requestPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			log.Printf("Invalid JSON in update user request: %v", err)
			respondWithError(w, http.StatusBadRequest, "Invalid request payload")
			return
		}

		if payload.ID == "" {
			respondWithError(w, http.StatusBadRequest, "User ID is required")
			return
		}

		// Optional: Validate role if provided
		if payload.Role != "" {
			allowedRoles := map[string]bool{"user": true, "admin": true, "creator": true}
			if !allowedRoles[payload.Role] {
				respondWithError(w, http.StatusBadRequest, "Invalid role specified")
				return
			}
		}

		// Start building update query
		setClauses := []string{}
		args := []interface{}{}
		argIndex := 1

		if payload.Email != "" {
			setClauses = append(setClauses, fmt.Sprintf("email = $%d", argIndex))
			args = append(args, payload.Email)
			argIndex++
		}
		if payload.FullName != "" {
			setClauses = append(setClauses, fmt.Sprintf("username = $%d", argIndex))
			args = append(args, payload.FullName)
			argIndex++
		}
		if payload.Role != "" {
			setClauses = append(setClauses, fmt.Sprintf("role = $%d", argIndex))
			args = append(args, payload.Role)
			argIndex++
		}
		if payload.Password != "" {
			hashed, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
			if err != nil {
				log.Printf("Failed to hash password: %v", err)
				respondWithError(w, http.StatusInternalServerError, "Failed to process password")
				return
			}
			setClauses = append(setClauses, fmt.Sprintf("password_hash = $%d", argIndex))
			args = append(args, hashed)
			argIndex++
		}
		if payload.IsEmailVerified != nil {
			setClauses = append(setClauses, fmt.Sprintf("is_email_verified = $%d", argIndex))
			args = append(args, *payload.IsEmailVerified)
			argIndex++
		}

		if len(setClauses) == 0 {
			respondWithError(w, http.StatusBadRequest, "No valid fields to update")
			return
		}

		setClauses = append(setClauses, "updated_at = NOW()")

		query := fmt.Sprintf(`UPDATE users SET %s WHERE id = $%d`, strings.Join(setClauses, ", "), argIndex)
		args = append(args, payload.ID)

		res, err := db.Exec(query, args...)
		if err != nil {
			log.Printf("Error updating user: %v", err)
			respondWithError(w, http.StatusInternalServerError, "Failed to update user")
			return
		}

		rowsAffected, err := res.RowsAffected()
		if err != nil {
			log.Printf("Error checking update rows affected: %v", err)
			respondWithError(w, http.StatusInternalServerError, "Failed to verify update")
			return
		}

		if rowsAffected == 0 {
			respondWithError(w, http.StatusNotFound, "User not found")
			return
		}

		respondWithJSON(w, http.StatusOK, map[string]string{"message": "User updated successfully"})
	}
}

// AdminDeleteUserHandler deletes a user by ID.
func AdminDeleteUserHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.PathValue("id")
		if userID == "" {
			respondWithError(w, http.StatusBadRequest, "User ID is required")
			return
		}

		// TODO: Implement cascading deletes or handle related data (orders, tickets, events created by this user)
		// Depending on your application logic, deleting a user might require deleting or reassigning
		// their associated data to maintain data integrity. This is a critical step!
		// For this example, we'll just delete the user row.

		result, err := db.Exec("DELETE FROM users WHERE id = $1", userID)
		if err != nil {
			log.Printf("Error deleting user: %v", err)
			respondWithError(w, http.StatusInternalServerError, "Failed to delete user")
			return
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil || rowsAffected == 0 {
			respondWithError(w, http.StatusNotFound, "User not found")
			return
		}

		respondWithJSON(w, http.StatusOK, map[string]string{"message": "User deleted successfully"})
	}
}
