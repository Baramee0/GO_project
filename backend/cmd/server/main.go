package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"task-management/internal/handlers"
	"task-management/internal/middleware"
	"task-management/internal/repository"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Connect to database
	db, err := repository.ConnectDB()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()
	log.Println("Database connected successfully")

	// Create repositories
	userRepo := repository.NewUserRepository(db)
	taskRepo := repository.NewTaskRepository(db)

	// Create handlers
	authHandler := handlers.NewAuthHandler(userRepo)
	taskHandler := handlers.NewTaskHandler(taskRepo)

	// Create router
	r := mux.NewRouter()

	// API routes
	api := r.PathPrefix("/api").Subrouter()

	// Public routes (no authentication required)
	api.HandleFunc("/auth/register", authHandler.Register).Methods("POST", "OPTIONS")
	api.HandleFunc("/auth/login", authHandler.Login).Methods("POST", "OPTIONS")
	api.HandleFunc("/auth/refresh", authHandler.RefreshToken).Methods("POST", "OPTIONS")

	// Protected routes (authentication required)
	protected := api.PathPrefix("").Subrouter()
	protected.Use(middleware.AuthMiddleware)
	protected.HandleFunc("/auth/me", authHandler.GetMe).Methods("GET")
	protected.HandleFunc("/tasks", taskHandler.GetTasks).Methods("GET")
	protected.HandleFunc("/tasks", taskHandler.CreateTask).Methods("POST", "OPTIONS")
	protected.HandleFunc("/tasks/{id}", taskHandler.GetTask).Methods("GET")
	protected.HandleFunc("/tasks/{id}", taskHandler.UpdateTask).Methods("PUT", "OPTIONS")
	protected.HandleFunc("/tasks/{id}", taskHandler.DeleteTask).Methods("DELETE", "OPTIONS")

	// Apply CORS middleware to all routes
	r.Use(middleware.CORSMiddleware)

	// Health check endpoint
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}).Methods("GET")

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Create HTTP server
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %s", port)
		log.Printf("API endpoints available at http://localhost:%s/api", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Failed to start server:", err)
		}
	}()

	// Wait for interrupt signal for graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")
}
