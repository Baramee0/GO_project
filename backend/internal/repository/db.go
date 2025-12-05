package repository

import (
	"database/sql"
	"fmt"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func ConnectDB() (*sql.DB, error) {

	if err := godotenv.Load(); err != nil {
		return nil, fmt.Errorf("failed to load environment variables: %w", err)
	}

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
	// open connection to the database
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// ping the database to check if the connection is alive
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	return db, nil
}

// getEnv returns the value of the environment variable or the default value if the variable is not set
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
