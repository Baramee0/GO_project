package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Get database connection string
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	if dbHost == "" {
		dbHost = "localhost"
	}
	if dbPort == "" {
		dbPort = "5432"
	}

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName)

	// Connect to database
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	log.Println("Database connected successfully")

	// Check if admin already exists
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM users WHERE system_role = 'admin'").Scan(&count)
	if err != nil {
		log.Fatal("Failed to check for existing admin:", err)
	}

	if count > 0 {
		log.Println("Admin user already exists. Skipping creation.")
		return
	}

	// Create admin user
	adminID := uuid.New().String()
	adminEmail := "admin@taskflow.com"
	adminPassword := "admin123" // Change this!
	adminName := "System Admin"

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}

	query := `
		INSERT INTO users (id, email, password_hash, name, system_role, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
	`

	_, err = db.Exec(query, adminID, adminEmail, string(hashedPassword), adminName, "admin")
	if err != nil {
		log.Fatal("Failed to create admin user:", err)
	}

	log.Println("✅ Admin user created successfully!")
	log.Println("📧 Email:", adminEmail)
	log.Println("🔑 Password:", adminPassword)
	log.Println("⚠️  Please change the password after first login!")
}
