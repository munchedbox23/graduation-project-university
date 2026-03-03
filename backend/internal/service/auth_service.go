package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"bank-ops-monitor/internal/model"
	"bank-ops-monitor/internal/repository"
)

var ErrInvalidCredentials = errors.New("неверный email или пароль")

type AuthService struct {
	repo      *repository.EmployeeRepo
	jwtSecret string
	jwtTTL    time.Duration
}

func NewAuthService(repo *repository.EmployeeRepo, secret string, ttlHours int) *AuthService {
	return &AuthService{
		repo:      repo,
		jwtSecret: secret,
		jwtTTL:    time.Duration(ttlHours) * time.Hour,
	}
}

type Claims struct {
	EmployeeID   int64      `json:"employee_id"`
	DepartmentID int64      `json:"department_id"`
	Role         model.Role `json:"role"`
	jwt.RegisteredClaims
}

func (s *AuthService) Login(ctx context.Context, req model.LoginRequest) (*model.LoginResponse, error) {
	emp, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		// не раскрываем причину — возвращаем общую ошибку
		return nil, ErrInvalidCredentials
	}

	if emp.PasswordHash == nil {
		return nil, ErrInvalidCredentials
	}

	if err = bcrypt.CompareHashAndPassword([]byte(*emp.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	token, err := s.generateToken(emp)
	if err != nil {
		return nil, fmt.Errorf("generateToken: %w", err)
	}

	email := ""
	if emp.Email != nil {
		email = *emp.Email
	}

	return &model.LoginResponse{
		AccessToken: token,
		Me: model.EmployeeDTO{
			EmployeeID:   emp.EmployeeID,
			DepartmentID: emp.DepartmentID,
			FullName:     emp.FullName,
			Email:        email,
			Position:     emp.Position,
			Role:         emp.Role,
		},
	}, nil
}

func (s *AuthService) generateToken(emp *model.Employee) (string, error) {
	claims := Claims{
		EmployeeID:   emp.EmployeeID,
		DepartmentID: emp.DepartmentID,
		Role:         emp.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.jwtTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func (s *AuthService) ParseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
