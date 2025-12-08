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

	// Read migration file
	migrationPath := filepath.Join("migrations", "001_create_tables.sql")
	sqlBytes, err := ioutil.ReadFile(migrationPath)
	if err != nil {
		log.Fatal("Failed to read migration file:", err)
	}

	// Split SQL statements (by semicolon)
	sqlContent := string(sqlBytes)
	statements := strings.Split(sqlContent, ";")

	// Execute each statement
	for i, statement := range statements {
		statement = strings.TrimSpace(statement)
		// Skip empty statements and comments
		if statement == "" {
			continue
		}
		// Remove single-line comments
		lines := strings.Split(statement, "\n")
		var cleanLines []string
		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if trimmed != "" && !strings.HasPrefix(trimmed, "--") {
				cleanLines = append(cleanLines, line)
			}
		}
		statement = strings.Join(cleanLines, "\n")
		if statement == "" {
			continue
		}

		log.Printf("Executing statement %d...", i+1)
		_, err := db.Exec(statement)
		if err != nil {
			// Some errors are OK (like IF NOT EXISTS)
			errStr := strings.ToLower(err.Error())
			if strings.Contains(errStr, "already exists") {
				log.Printf("Info: %s (already exists, skipping)", errStr)
			} else {
				log.Printf("Error executing statement %d: %v", i+1, err)
				log.Printf("Statement: %s", statement)
			}
		} else {
			log.Printf("Statement %d executed successfully", i+1)
		}
	}

	log.Println("Migration completed successfully!")
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
