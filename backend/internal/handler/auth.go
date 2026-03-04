package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"bank-ops-monitor/internal/model"
	"bank-ops-monitor/internal/service"
)

// POST /api/auth/login
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "email и password обязательны")
		return
	}

	resp, err := h.authSvc.Login(r.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			writeError(w, http.StatusUnauthorized, err.Error())
			return
		}
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// GET /api/auth/me
func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	// Claims уже провалидированы JWT middleware и лежат в контексте.
	// Для MVP просто возвращаем 200 — данные уже есть в JWT на фронте.
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
