package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"

	"bank-ops-monitor/internal/config"
	"bank-ops-monitor/internal/handler"
	"bank-ops-monitor/internal/middleware"
	"bank-ops-monitor/internal/model"
	"bank-ops-monitor/internal/repository"
	"bank-ops-monitor/internal/service"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config.Load: %v", err)
	}

	ctx := context.Background()

	// --- Database ---
	pool, err := repository.NewPool(ctx, cfg.DB)
	if err != nil {
		log.Fatalf("repository.NewPool: %v\n\nПодсказка: убедитесь, что PostgreSQL запущен и данные в .env верны", err)
	}
	defer pool.Close()
	log.Println("Подключено к PostgreSQL")

	// --- Repositories ---
	empRepo := repository.NewEmployeeRepo(pool)
	crudRepo := repository.NewCRUDRepository(pool)

	// --- Services ---
	authSvc := service.NewAuthService(empRepo, cfg.JWT.Secret, cfg.JWT.TTLHours)

	// --- Handlers ---
	h := handler.New(authSvc, crudRepo)

	// --- Router ---
	r := chi.NewRouter()
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(corsMiddleware)

	// Public routes
	r.Post("/api/auth/login", h.Login)

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.JWT(authSvc))

		// Auth
		r.Get("/api/auth/me", h.Me)

		// Departments (list for all authenticated, create for ADMIN)
		r.Get("/api/departments", h.ListDepartments)
		r.With(middleware.RequireRole(model.RoleAdmin)).Post("/api/departments", h.CreateDepartment)

		// Employees
		r.With(middleware.RequireRole(model.RoleAdmin, model.RoleHead)).Get("/api/employees", h.ListEmployees)
		r.With(middleware.RequireRole(model.RoleAdmin)).Post("/api/employees", h.CreateEmployee)
		r.With(middleware.RequireRole(model.RoleAdmin)).Patch("/api/employees/{id}", h.UpdateEmployee)

		// Operation Types
		r.Get("/api/operation-types", h.ListOperationTypes)
		r.With(middleware.RequireRole(model.RoleAdmin)).Post("/api/operation-types", h.CreateOperationType)

		// Operations
		r.Get("/api/operations", h.ListOperations)
		r.Post("/api/operations", h.CreateOperation)
		r.With(middleware.RequireRole(model.RoleAdmin)).Post("/api/import/operations", h.ImportOperations)

		// SLA
		r.Get("/api/sla", h.ListSLA)
		r.With(middleware.RequireRole(model.RoleAdmin)).Post("/api/sla", h.CreateSLA)
		r.With(middleware.RequireRole(model.RoleAdmin)).Patch("/api/sla/{id}", h.UpdateSLA)

		// KPI
		r.Get("/api/kpi/templates", h.ListKPITemplates)
		r.With(middleware.RequireRole(model.RoleAdmin)).Post("/api/kpi/templates", h.CreateKPITemplate)
		r.Get("/api/kpi/results", h.ListKPIResults)
		r.With(middleware.RequireRole(model.RoleAdmin, model.RoleHead)).Post("/api/kpi/recalculate", h.RecalculateKPI)

		// Tasks
		r.Get("/api/tasks", h.ListTasks)
		r.With(middleware.RequireRole(model.RoleAdmin, model.RoleHead)).Post("/api/tasks", h.CreateTask)
		r.Patch("/api/tasks/{id}", h.UpdateTask)

		// Schedule
		r.Get("/api/schedule", h.ListSchedule)
		r.Post("/api/schedule", h.CreateSchedule)
		r.With(middleware.RequireRole(model.RoleAdmin, model.RoleHead)).Patch("/api/schedule/{id}", h.UpdateSchedule)
		r.With(middleware.RequireRole(model.RoleAdmin, model.RoleHead)).Delete("/api/schedule/{id}", h.DeleteSchedule)

		// Dashboard
		r.With(middleware.RequireRole(model.RoleAdmin, model.RoleHead)).Get("/api/dashboard/head", h.DashboardHead)
		r.Get("/api/dashboard/employee", h.DashboardEmployee)
		r.Get("/api/dashboard/trend", h.DashboardTrend)
		r.Get("/api/dashboard/op-types", h.DashboardOpTypes)

		// Reports
		r.With(middleware.RequireRole(model.RoleAdmin, model.RoleHead)).Get("/api/reports/daily", h.ReportDaily)

		// Audit
		r.With(middleware.RequireRole(model.RoleAdmin)).Get("/api/audit", h.ListAudit)
	})

	addr := fmt.Sprintf(":%s", cfg.Server.Port)
	log.Printf("Сервер запущен на http://localhost%s", addr)

	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	if err = srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("ListenAndServe: %v", err)
	}
}

// corsMiddleware разрешает запросы от фронтенда (dev: localhost:3000)
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
