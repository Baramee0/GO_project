package main

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Get database URL
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = fmt.Sprintf(
			"postgres://%s:%s@%s:%s/%s?sslmode=disable",
			getEnv("DB_USER", "postgres"),
			getEnv("DB_PASSWORD", "password"),
			getEnv("DB_HOST", "localhost"),
			getEnv("DB_PORT", "5432"),
			getEnv("DB_NAME", "task_management"),
		)
	}

	// Connect to database
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	log.Println("Database connected successfully")

	// Run migration 002
	migrationPath := filepath.Join("migrations", "002_add_collaboration.sql")
	log.Printf("Running migration: %s", migrationPath)

	sqlBytes, err := ioutil.ReadFile(migrationPath)
	if err != nil {
		log.Fatal("Failed to read migration file:", err)
	}

	// Execute the entire SQL file at once (to handle DO blocks properly)
	sqlContent := string(sqlBytes)

	log.Println("Executing migration...")
	_, err = db.Exec(sqlContent)
	if err != nil {
		// Check if error is about already existing objects
		if strings.Contains(strings.ToLower(err.Error()), "already exists") ||
			strings.Contains(strings.ToLower(err.Error()), "duplicate column") {
			log.Println("Warning: Some objects already exist, migration may have been partially applied")
		} else {
			log.Printf("Error executing migration: %v", err)
			log.Fatal("Migration failed")
		}
	}

	log.Println("Migration 002 completed successfully!")
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
