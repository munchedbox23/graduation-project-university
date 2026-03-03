package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"bank-ops-monitor/internal/model"
)

type EmployeeRepo struct {
	db *pgxpool.Pool
}

func NewEmployeeRepo(db *pgxpool.Pool) *EmployeeRepo {
	return &EmployeeRepo{db: db}
}

func (r *EmployeeRepo) FindByEmail(ctx context.Context, email string) (*model.Employee, error) {
	const q = `
		SELECT employee_id, department_id, full_name, position, experience_years,
		       phone, salary, email, password_hash, role
		FROM employee
		WHERE email = $1
		LIMIT 1`

	row := r.db.QueryRow(ctx, q, email)

	var e model.Employee
	if err := row.Scan(
		&e.EmployeeID,
		&e.DepartmentID,
		&e.FullName,
		&e.Position,
		&e.ExperienceYears,
		&e.Phone,
		&e.Salary,
		&e.Email,
		&e.PasswordHash,
		&e.Role,
	); err != nil {
		return nil, fmt.Errorf("FindByEmail scan: %w", err)
	}

	return &e, nil
}
