import type { ProjectOptions } from "../types/index.ts";
import type { FileMap } from "../utils/fs.ts";

function modulePath(projectName: string): string {
  const safe = projectName.toLowerCase().replace(/[^a-z0-9-_]/g, "-");
  return `${safe}/server`;
}

/** Go + Fiber API file map (server/ + Makefile + compose). Client comes from common. */
export function goFiberFiles(o: ProjectOptions): FileMap {
  const mod = modulePath(o.projectName);
  return {
    [`server/go.mod`]: `module ${mod}

go 1.24

require (
\tgithub.com/gofiber/fiber/v2 v2.52.9
\tgithub.com/jackc/pgx/v5 v5.7.4
\tgithub.com/joho/godotenv v1.5.1
)
`,
    [`server/.env.example`]: `# copy to server/.env
PORT=5000
CLIENT_URL=http://localhost:5173
# Optional — when set, the API pings Postgres on boot (docker compose provides it).
DATABASE_URL=postgres://postgres:postgres@localhost:5432/stackit
`,
    [`server/cmd/api/main.go`]: `// Command api starts the Fiber HTTP server.
package main

import (
\t"log"

\t"${mod}/internal/config"
\t"${mod}/internal/db"
\t"${mod}/internal/middleware"
\t"${mod}/internal/routes"

\t"github.com/gofiber/fiber/v2"
)

func main() {
\tcfg := config.Load()

\tif err := db.Connect(cfg.DatabaseURL); err != nil {
\t\tlog.Printf("warning: database unavailable (%v) — running without persistence", err)
\t}

\tapp := fiber.New(fiber.Config{AppName: "${o.projectName}"})
\tmiddleware.Register(app, cfg.ClientURL)
\troutes.Register(app)

\tlog.Printf("API listening on http://localhost:%s", cfg.Port)
\tif err := app.Listen(":" + cfg.Port); err != nil {
\t\tlog.Fatal(err)
\t}
}
`,
    [`server/internal/config/config.go`]: `// Package config loads server configuration from the environment.
package config

import (
\t"os"

\t"github.com/joho/godotenv"
)

// Config holds runtime configuration for the API.
type Config struct {
\tPort        string
\tClientURL   string
\tDatabaseURL string
}

func getenv(key, fallback string) string {
\tif v := os.Getenv(key); v != "" {
\t\treturn v
\t}
\treturn fallback
}

// Load reads server/.env (best effort) then the process environment.
func Load() Config {
\t_ = godotenv.Load() // server/.env when running from server/
\t_ = godotenv.Load("server/.env")
\treturn Config{
\t\tPort:        getenv("PORT", "5000"),
\t\tClientURL:   getenv("CLIENT_URL", "http://localhost:5173"),
\t\tDatabaseURL: getenv("DATABASE_URL", ""),
\t}
}
`,
    [`server/internal/db/db.go`]: `// Package db manages the optional Postgres connection pool.
package db

import (
\t"context"
\t"time"

\t"github.com/jackc/pgx/v5/pgxpool"
)

// Pool is nil when DATABASE_URL is unset — handlers must work without it.
var Pool *pgxpool.Pool

// Connect dials Postgres when dsn is non-empty.
func Connect(dsn string) error {
\tif dsn == "" {
\t\treturn nil
\t}
\tctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
\tdefer cancel()
\tpool, err := pgxpool.New(ctx, dsn)
\tif err != nil {
\t\treturn err
\t}
\tif err := pool.Ping(ctx); err != nil {
\t\tpool.Close()
\t\treturn err
\t}
\tconst schema = \`CREATE TABLE IF NOT EXISTS users (
\t\tid SERIAL PRIMARY KEY,
\t\tname TEXT NOT NULL,
\t\temail TEXT NOT NULL UNIQUE,
\t\tcreated_at TIMESTAMPTZ NOT NULL DEFAULT now()
\t)\`
\tif _, err := pool.Exec(ctx, schema); err != nil {
\t\tpool.Close()
\t\treturn err
\t}
\tPool = pool
\treturn nil
}
`,
    [`server/internal/models/user.go`]: `// Package models holds domain types.
package models

import "time"

// User is the example resource for the /api/users endpoints.
type User struct {
\tID        int64     \`json:"id"\`
\tName      string    \`json:"name"\`
\tEmail     string    \`json:"email"\`
\tCreatedAt time.Time \`json:"createdAt"\`
}
`,
    [`server/internal/handlers/health.go`]: `package handlers

import (
\t"time"

\t"github.com/gofiber/fiber/v2"
)

var startedAt = time.Now()

// Health reports liveness for the Vite demo page and load balancers.
func Health(c *fiber.Ctx) error {
\treturn c.JSON(fiber.Map{
\t\t"status": "ok",
\t\t"uptime": time.Since(startedAt).Seconds(),
\t})
}
`,
    [`server/internal/handlers/users.go`]: `package handlers

import (
\t"context"
\t"sync"
\t"time"

\t"${mod}/internal/db"
\t"${mod}/internal/models"

\t"github.com/gofiber/fiber/v2"
)

var (
\tmu     sync.Mutex
\tmemory []models.User
\tnextID int64 = 1
)

type createUserInput struct {
\tName  string \`json:"name"\`
\tEmail string \`json:"email"\`
}

// ListUsers serves GET /api/users from Postgres when available,
// otherwise from the in-memory fallback.
func ListUsers(c *fiber.Ctx) error {
\tif db.Pool != nil {
\t\trows, err := db.Pool.Query(context.Background(),
\t\t\t\`SELECT id, name, email, created_at FROM users ORDER BY id DESC\`)
\t\tif err != nil {
\t\t\treturn fiber.NewError(fiber.StatusInternalServerError, err.Error())
\t\t}
\t\tdefer rows.Close()
\t\tusers := []models.User{}
\t\tfor rows.Next() {
\t\t\tvar u models.User
\t\t\tif err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.CreatedAt); err != nil {
\t\t\t\treturn fiber.NewError(fiber.StatusInternalServerError, err.Error())
\t\t\t}
\t\t\tusers = append(users, u)
\t\t}
\t\treturn c.JSON(fiber.Map{"data": users})
\t}
\tmu.Lock()
\tdefer mu.Unlock()
\treturn c.JSON(fiber.Map{"data": memory})
}

// CreateUsers serves POST /api/users with minimal validation.
func CreateUsers(c *fiber.Ctx) error {
\tvar in createUserInput
\tif err := c.BodyParser(&in); err != nil {
\t\treturn fiber.NewError(fiber.StatusBadRequest, "invalid JSON body")
\t}
\tif in.Name == "" || in.Email == "" {
\t\treturn fiber.NewError(fiber.StatusBadRequest, "name and email are required")
\t}
\tif db.Pool != nil {
\t\tvar u models.User
\t\terr := db.Pool.QueryRow(context.Background(),
\t\t\t\`INSERT INTO users (name, email) VALUES ($1, $2)
\t\t\t RETURNING id, name, email, created_at\`, in.Name, in.Email,
\t\t).Scan(&u.ID, &u.Name, &u.Email, &u.CreatedAt)
\t\tif err != nil {
\t\t\treturn fiber.NewError(fiber.StatusBadRequest, err.Error())
\t\t}
\t\treturn c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": u})
\t}
\tmu.Lock()
\tdefer mu.Unlock()
\tu := models.User{ID: nextID, Name: in.Name, Email: in.Email, CreatedAt: time.Now()}
\tnextID++
\tmemory = append(memory, u)
\treturn c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": u})
}
`,
    [`server/internal/middleware/middleware.go`]: `// Package middleware bundles the global Fiber middleware chain.
package middleware

import (
\t"github.com/gofiber/fiber/v2"
\t"github.com/gofiber/fiber/v2/middleware/cors"
\t"github.com/gofiber/fiber/v2/middleware/logger"
\t"github.com/gofiber/fiber/v2/middleware/recover"
)

// Register adds recover, logging and CORS (locked to the Vite origin).
func Register(app *fiber.App, clientURL string) {
\tapp.Use(recover.New())
\tapp.Use(logger.New())
\tapp.Use(cors.New(cors.Config{AllowOrigins: clientURL}))
}
`,
    [`server/internal/routes/routes.go`]: `// Package routes wires handlers to paths.
package routes

import (
\t"${mod}/internal/handlers"

\t"github.com/gofiber/fiber/v2"
)

// Register mounts /api/health and /api/users.
func Register(app *fiber.App) {
\tapi := app.Group("/api")
\tapi.Get("/health", handlers.Health)
\tapi.Get("/users", handlers.ListUsers)
\tapi.Post("/users", handlers.CreateUsers)
}
`,
    [`docker-compose.yml`]: `services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: stackit
    volumes: ["pg-data:/var/lib/postgresql/data"]
volumes:
  pg-data:
`,
  };
}
