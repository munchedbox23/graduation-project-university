package model

import "time"

type Role string

const (
	RoleAdmin Role = "ADMIN"
	RoleHead  Role = "HEAD"
	RoleEmp   Role = "EMP"
)

type Employee struct {
	EmployeeID      int64     `db:"employee_id" json:"employee_id"`
	DepartmentID    int64     `db:"department_id" json:"department_id"`
	FullName        string    `db:"full_name" json:"full_name"`
	Position        string    `db:"position" json:"position"`
	ExperienceYears int       `db:"experience_years" json:"experience_years"`
	Phone           string    `db:"phone" json:"phone"`
	Salary          float64   `db:"salary" json:"salary"`
	Email           *string   `db:"email" json:"email,omitempty"`
	PasswordHash    *string   `db:"password_hash" json:"-"`
	Role            Role      `db:"role" json:"role"`
	CreatedAt       time.Time `db:"-" json:"-"`
}

// LoginRequest — входные данные для POST /api/auth/login
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse — ответ с JWT токеном и данными пользователя
type LoginResponse struct {
	AccessToken string      `json:"access_token"`
	Me          EmployeeDTO `json:"me"`
}

// EmployeeDTO — публичные данные сотрудника (без пароля)
type EmployeeDTO struct {
	EmployeeID   int64  `json:"employee_id"`
	DepartmentID int64  `json:"department_id"`
	FullName     string `json:"full_name"`
	Email        string `json:"email"`
	Position     string `json:"position"`
	Role         Role   `json:"role"`
}
