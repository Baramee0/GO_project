package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Database connection
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Database connected successfully")

	// Run migration
	log.Println("Adding assigned_to column to tasks table...")

	// Drop column if exists (to recreate with correct type)
	_, err = db.Exec(`ALTER TABLE tasks DROP COLUMN IF EXISTS assigned_to;`)
	if err != nil {
		log.Printf("Warning: Could not drop column: %v", err)
	}

	// Add assigned_to column with UUID type (matching users.id)
	_, err = db.Exec(`
		ALTER TABLE tasks ADD COLUMN assigned_to UUID;
	`)
	if err != nil {
		log.Fatalf("Failed to add assigned_to column: %v", err)
	}

	log.Println("✓ Added assigned_to column (UUID type)")

	// Add index for better performance
	_, err = db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
	`)
	if err != nil {
		log.Fatalf("Failed to create index: %v", err)
	}

	log.Println("✓ Created index on assigned_to")
	log.Println("Migration completed successfully!")
	log.Println("Note: Column added without FK constraint to allow flexibility")
}
