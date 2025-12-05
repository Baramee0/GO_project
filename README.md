# Next.js Frontend + Go Backend + PostgreSQL

Full-stack application with Next.js frontend, Go REST API backend, and PostgreSQL database.

## Architecture

- **Frontend**: Next.js 14+ (TypeScript) with App Router
- **Backend**: Go REST API server
- **Database**: PostgreSQL

## Project Structure

```
project-root/
  frontend/          # Next.js application
  backend/           # Go API server
  docker-compose.yml # Optional: for local development
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Go 1.21+
- PostgreSQL 14+

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GO_project
   ```

2. **Setup PostgreSQL**
   ```bash
   # Using Docker
   docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
   
   # Or install PostgreSQL locally
   ```

3. **Setup Backend (Go)**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   go mod download
   go run cmd/server/main.go
   ```

4. **Setup Frontend (Next.js)**
   ```bash
   cd frontend
   cp .env.local.example .env.local
   # Edit .env.local with API URL
   npm install
   npm run dev
   ```

## Environment Variables

## Tech Stack

- **Frontend**: Next.js, TypeScript, React, Tailwind CSS
- **Backend**: Go, gorilla/mux (or net/http), PostgreSQL
- **Database**: PostgreSQL
- **ORM/Driver**: database/sql with pgx or GORM
