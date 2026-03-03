package middleware

import (
	"context"
	"net/http"
	"strings"

	"bank-ops-monitor/internal/model"
	"bank-ops-monitor/internal/service"
)

type contextKey string

const ClaimsKey contextKey = "claims"

// JWT проверяет Authorization: Bearer <token> и кладёт claims в контекст.
func JWT(authSvc *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}

			parts := strings.SplitN(header, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				http.Error(w, `{"error":"bad authorization header"}`, http.StatusUnauthorized)
				return
			}

			claims, err := authSvc.ParseToken(parts[1])
			if err != nil {
				http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), ClaimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetClaims извлекает Claims из контекста запроса (может быть nil).
func GetClaims(r *http.Request) *service.Claims {
	v := r.Context().Value(ClaimsKey)
	if v == nil {
		return nil
	}
	c, _ := v.(*service.Claims)
	return c
}

// RequireRole — middleware, пропускающий только запросы с нужной ролью.
func RequireRole(roles ...model.Role) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := GetClaims(r)
			if claims == nil {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			for _, role := range roles {
				if claims.Role == role {
					next.ServeHTTP(w, r)
					return
				}
			}
			http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
		})
	}
}
