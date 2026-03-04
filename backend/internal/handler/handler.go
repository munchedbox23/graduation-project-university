package handler

import (
	"encoding/json"
	"net/http"

	"bank-ops-monitor/internal/repository"
	"bank-ops-monitor/internal/service"
)

type Handler struct {
	authSvc  *service.AuthService
	crudRepo *repository.CRUDRepository
}

func New(authSvc *service.AuthService, crudRepo *repository.CRUDRepository) *Handler {
	return &Handler{authSvc: authSvc, crudRepo: crudRepo}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func decodeJSON(r *http.Request, v any) error {
	return json.NewDecoder(r.Body).Decode(v)
}
