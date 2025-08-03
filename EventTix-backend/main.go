package main

import (
	"TickVibe-EventTix-backend/database"
	"TickVibe-EventTix-backend/internal/handlers"
	"TickVibe-EventTix-backend/internal/handlers/adminHandlers"
	"TickVibe-EventTix-backend/internal/middleware"
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/joho/godotenv"
)

const Port = "localhost:8080"

func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Always allow the requesting origin
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}

		// Allow necessary methods
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		// Allow necessary headers
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cookie")
		// Always allow credentials
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		// Set max age for preflight cache
		w.Header().Set("Access-Control-Max-Age", "86400")

		// If it's a preflight request, respond OK
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Pass down the request to the next handler
		next.ServeHTTP(w, r)
	})
}

func setupRoutes(db *sql.DB) *http.ServeMux {
	mux := http.NewServeMux()

	// --- API Routes ---

	// Authentication routes
	mux.HandleFunc("POST /signup", handlers.SignUp(db))                            // Use method matching
	mux.HandleFunc("POST /login", handlers.Login(db))                              // Use method matching
	mux.HandleFunc("GET /api/auth/me", middleware.RequireAuth(handlers.JwtTest())) // Protected route example
	mux.HandleFunc("POST /logout", middleware.RequireAuth(handlers.Logout()))      // Use method matching
	// mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
	// 	http.NotFound(w, r)
	// })

	// Matches /events, /events/, /events/music, /events/music/rock, etc.
	mux.HandleFunc("GET /verify", handlers.VerifyEmail(db))
	mux.HandleFunc("POST /api/auth/resend-verification", handlers.ResendVerification(db))
	mux.HandleFunc("POST /api/auth/reset-password", handlers.ResetPassword(db))
	mux.HandleFunc("POST /api/auth/forgot-password", handlers.ForgotPassword(db))
	// The ListEventsHandler will parse the path segments internally.
	mux.HandleFunc("GET /api/events", handlers.GetEventsHandler(db)) // Use method matching and trailing slash
	mux.HandleFunc("GET /account-settings", middleware.RequireAuth(handlers.ProfileHandler(db)))
	mux.HandleFunc("PUT /api/user/update-password", middleware.RequireAuth(handlers.UpdatePasswordHandler(db)))
	mux.HandleFunc("DELETE /api/user/delete-account", middleware.RequireAuth(handlers.UserDeleteAccountHandler(db)))
	/* admin-events */
	mux.HandleFunc("GET /api/admin/events", middleware.RequireAdminOrCreator(adminHandlers.AdminCreatorListEventsHandler(db)))
	mux.HandleFunc("GET /api/admin/event/{slug}", middleware.RequireAdminOrCreator(adminHandlers.AdminCreatorGetEventBySlugHandler(db)))
	mux.HandleFunc("POST /api/admin/events", middleware.RequireAdminOrCreator(adminHandlers.AdminAndCreatorCreateEventHandler(db)))
	mux.HandleFunc("GET /api/admin/event/{event_id}/ticket-types", middleware.RequireAdminOrCreator(adminHandlers.AdminCreatorListTicketTypesHandler(db)))
	mux.HandleFunc("GET /api/admin/event/{event_id}/tickets", middleware.RequireAdminOrCreator(adminHandlers.AdminCreatorListEventTicketsHandler(db)))
	mux.HandleFunc("GET /api/admin/events/{event_id}/orders", middleware.RequireAdminOrCreator(adminHandlers.AdminCreatorListEventOrdersHandler(db)))
	mux.HandleFunc("PUT /api/admin/events/{id}", middleware.RequireAdminOrCreator(adminHandlers.AdminCreatorUpdateEventHandler(db)))
	mux.HandleFunc("DELETE /api/admin/event/{id}", middleware.RequireAdminOrCreator(adminHandlers.AdminDeleteEventHandler(db)))
	mux.HandleFunc("GET /api/admin/users", middleware.RequireAdmin(adminHandlers.AdminGetUsersHandler(db)))
	mux.HandleFunc("PUT /api/admin/users-update", middleware.RequireAdmin(adminHandlers.AdminUpdateUserHandler(db))) // Example: Update Role
	mux.HandleFunc("DELETE /api/admin/users/{id}", middleware.RequireAdmin(adminHandlers.AdminDeleteUserHandler(db)))
	mux.HandleFunc("POST /api/admin/users-create", middleware.RequireAdmin(adminHandlers.AdminAddUserHandler(db)))
	// Single event details route
	// Matches /event/{slug} - e.g., /event/my-awesome-event
	mux.HandleFunc("GET /api/events/{slug}", handlers.GetEventBySlugHandler(db))
	// Handles /{parentCategory} and /{parentCategory}/{subcategory}
	mux.HandleFunc("GET /api/categories", handlers.GetNestedCategoriesHandler(db))
	mux.HandleFunc("GET /api/events/upcoming", handlers.GetUpcomingEventsHandler(db))
	mux.HandleFunc("GET /api/cities", handlers.GetVoivodeshipsWithCities(db))
	mux.HandleFunc("POST /api/success", handlers.PayTest(db))
	// purchase
	mux.HandleFunc("GET /myTickets", middleware.RequireAuth(handlers.UserTicketsHandler(db)))
	mux.HandleFunc("POST /checkout/create-session", handlers.CreateCheckoutSessionHandler(db))
	mux.HandleFunc("GET /api/orders/session/", handlers.GetOrderBySessionIDHandler(db))
	mux.HandleFunc("POST /qrCodeScanning", handlers.QrCodeScanning(db))
	mux.HandleFunc("POST /validateTicket", handlers.ValidateTicket(db))

	return mux
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	db := database.Connect()
	defer db.Close()

	// Check if the database is reachable
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	} else {
		log.Println("Successfully connected to database!")
	}

	mux := setupRoutes(db)

	// Serve static files first (higher priority)
	staticDir := "C:/Users/User/Desktop/Sahin_DegreeProject/eventix-client/dist"
	imagesDir := "./images"

	// Handle static assets (CSS, JS, images, etc.)
	mux.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir(filepath.Join(staticDir, "assets")))))
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir(filepath.Join(staticDir, "static")))))
	mux.Handle("/events/images/", http.StripPrefix("/events/images/", http.FileServer(http.Dir(imagesDir)))) // Serve images from the images directory
	// Handle favicon and other root-level static files
	mux.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, filepath.Join(staticDir, "favicon.ico"))
	})

	// Catch-all handler for React Router (should be last)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// List of API prefixes that should return 404 if not handled
		apiPrefixes := []string{"/api/", "/admin/", "/signup", "/login", "/logout", "/verify", "/resend-verification", "/forgot-password", "/cities", "/success", "/myTickets", "/checkout/", "/qrCodeScanning", "/validateTicket"}

		// Check if it's an API route
		for _, prefix := range apiPrefixes {
			if strings.HasPrefix(r.URL.Path, prefix) {
				http.NotFound(w, r)
				return
			}
		}

		// For root path, serve index.html
		if r.URL.Path == "/" {
			http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
			return
		}

		// Try to serve static file first
		filePath := filepath.Join(staticDir, r.URL.Path)
		if info, err := os.Stat(filePath); err == nil && !info.IsDir() {
			http.ServeFile(w, r, filePath)
			return
		}

		// If no static file found and it's not an API route, serve index.html for React Router
		http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
	})

	handlerWithCors := CORSMiddleware(mux)

	server := &http.Server{
		Addr:         Port,
		Handler:      handlerWithCors,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}
	// Start the server in a goroutine
	go func() {
		log.Println("🚀 Starting server on", Port)
		// ListenAndServe always returns non-nil error, so log.Fatal is appropriate here
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	// syscall.SIGINT for Ctrl+C, syscall.SIGTERM for kill command
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit // Block until a signal is received

	// Graceful shutdown
	log.Println("Shutting down server...")
	// Create a context with a timeout for the shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second) // Give it 15 seconds to shut down gracefully
	defer cancel()                                                           // Release resources used by the context

	// Shutdown the server gracefully
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server Shutdown Failed: %v", err) // Log fatal if shutdown fails
	}
	log.Println("Server gracefully stopped") // Log successful shutdown
}
