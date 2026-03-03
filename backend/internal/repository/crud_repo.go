package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"bank-ops-monitor/internal/model"
)

type CRUDRepository struct {
	pool *pgxpool.Pool
}

func NewCRUDRepository(pool *pgxpool.Pool) *CRUDRepository {
	return &CRUDRepository{pool: pool}
}

// ===== DEPARTMENTS =====

func (r *CRUDRepository) ListDepartments(ctx context.Context) ([]model.Department, error) {
	rows, err := r.pool.Query(ctx, `SELECT department_id, name, phone FROM department ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []model.Department
	for rows.Next() {
		var d model.Department
		if err := rows.Scan(&d.DepartmentID, &d.Name, &d.Phone); err != nil {
			return nil, err
		}
		result = append(result, d)
	}
	return result, nil
}

func (r *CRUDRepository) CreateDepartment(ctx context.Context, name, phone string) (*model.Department, error) {
	var d model.Department
	err := r.pool.QueryRow(ctx,
		`INSERT INTO department (name, phone) VALUES ($1, $2) RETURNING department_id, name, phone`,
		name, phone,
	).Scan(&d.DepartmentID, &d.Name, &d.Phone)
	return &d, err
}

// ===== EMPLOYEES =====

func (r *CRUDRepository) ListEmployees(ctx context.Context) ([]model.Employee, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT employee_id, department_id, full_name, position, experience_years, phone, salary, email, password_hash, role
		FROM employee ORDER BY full_name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []model.Employee
	for rows.Next() {
		var e model.Employee
		if err := rows.Scan(&e.EmployeeID, &e.DepartmentID, &e.FullName, &e.Position,
			&e.ExperienceYears, &e.Phone, &e.Salary, &e.Email, &e.PasswordHash, &e.Role); err != nil {
			return nil, err
		}
		result = append(result, e)
	}
	return result, nil
}

func (r *CRUDRepository) CreateEmployee(ctx context.Context, req model.CreateEmployeeRequest) (*model.Employee, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}
	var e model.Employee
	err = r.pool.QueryRow(ctx, `
		INSERT INTO employee (department_id, full_name, position, phone, salary, experience_years, email, password_hash, role)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		RETURNING employee_id, department_id, full_name, position, experience_years, phone, salary, email, password_hash, role
	`, req.DepartmentID, req.FullName, req.Position, req.Phone, req.Salary,
		req.ExperienceYears, req.Email, string(hash), req.Role,
	).Scan(&e.EmployeeID, &e.DepartmentID, &e.FullName, &e.Position,
		&e.ExperienceYears, &e.Phone, &e.Salary, &e.Email, &e.PasswordHash, &e.Role)
	return &e, err
}

func (r *CRUDRepository) UpdateEmployee(ctx context.Context, id int64, req model.UpdateEmployeeRequest) (*model.Employee, error) {
	setClauses := []string{}
	args := []interface{}{}
	idx := 1
	if req.FullName != nil {
		setClauses = append(setClauses, fmt.Sprintf("full_name=$%d", idx))
		args = append(args, *req.FullName)
		idx++
	}
	if req.Position != nil {
		setClauses = append(setClauses, fmt.Sprintf("position=$%d", idx))
		args = append(args, *req.Position)
		idx++
	}
	if req.Phone != nil {
		setClauses = append(setClauses, fmt.Sprintf("phone=$%d", idx))
		args = append(args, *req.Phone)
		idx++
	}
	if req.Email != nil {
		setClauses = append(setClauses, fmt.Sprintf("email=$%d", idx))
		args = append(args, *req.Email)
		idx++
	}
	if req.Salary != nil {
		setClauses = append(setClauses, fmt.Sprintf("salary=$%d", idx))
		args = append(args, *req.Salary)
		idx++
	}
	if req.ExperienceYears != nil {
		setClauses = append(setClauses, fmt.Sprintf("experience_years=$%d", idx))
		args = append(args, *req.ExperienceYears)
		idx++
	}
	if req.Role != nil {
		setClauses = append(setClauses, fmt.Sprintf("role=$%d", idx))
		args = append(args, *req.Role)
		idx++
	}
	if req.DepartmentID != nil {
		setClauses = append(setClauses, fmt.Sprintf("department_id=$%d", idx))
		args = append(args, *req.DepartmentID)
		idx++
	}
	if len(setClauses) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}
	args = append(args, id)
	query := fmt.Sprintf(
		`UPDATE employee SET %s WHERE employee_id=$%d RETURNING employee_id, department_id, full_name, position, experience_years, phone, salary, email, password_hash, role`,
		strings.Join(setClauses, ","), idx,
	)
	var e model.Employee
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&e.EmployeeID, &e.DepartmentID, &e.FullName, &e.Position,
		&e.ExperienceYears, &e.Phone, &e.Salary, &e.Email, &e.PasswordHash, &e.Role,
	)
	return &e, err
}

// ===== OPERATION TYPES =====

func (r *CRUDRepository) ListOperationTypes(ctx context.Context) ([]model.OperationType, error) {
	rows, err := r.pool.Query(ctx, `SELECT operation_type_id, name, category FROM operation_type ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []model.OperationType
	for rows.Next() {
		var ot model.OperationType
		if err := rows.Scan(&ot.OperationTypeID, &ot.Name, &ot.Category); err != nil {
			return nil, err
		}
		result = append(result, ot)
	}
	return result, nil
}

func (r *CRUDRepository) CreateOperationType(ctx context.Context, name string, category *string) (*model.OperationType, error) {
	var ot model.OperationType
	err := r.pool.QueryRow(ctx,
		`INSERT INTO operation_type (name, category) VALUES ($1,$2) RETURNING operation_type_id, name, category`,
		name, category,
	).Scan(&ot.OperationTypeID, &ot.Name, &ot.Category)
	return &ot, err
}

// ===== OPERATIONS =====

type OperationFilter struct {
	EmployeeID      *int64
	OperationTypeID *int64
	From            *time.Time
	To              *time.Time
	Status          *string
}

func (r *CRUDRepository) ListOperations(ctx context.Context, f OperationFilter) ([]model.Operation, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	idx := 1
	if f.EmployeeID != nil {
		where = append(where, fmt.Sprintf("o.employee_id=$%d", idx))
		args = append(args, *f.EmployeeID)
		idx++
	}
	if f.OperationTypeID != nil {
		where = append(where, fmt.Sprintf("o.operation_type_id=$%d", idx))
		args = append(args, *f.OperationTypeID)
		idx++
	}
	if f.From != nil {
		where = append(where, fmt.Sprintf("o.start_time>=$%d", idx))
		args = append(args, *f.From)
		idx++
	}
	if f.To != nil {
		where = append(where, fmt.Sprintf("o.start_time<$%d", idx))
		args = append(args, *f.To)
		idx++
	}
	if f.Status != nil {
		where = append(where, fmt.Sprintf("o.status=$%d", idx))
		args = append(args, *f.Status)
		idx++
	}
	_ = idx
	query := fmt.Sprintf(`
		SELECT o.operation_id, o.employee_id, o.operation_type_id, o.start_time, o.end_time, o.status,
		       e.full_name as employee_name, ot.name as operation_type_name,
		       CASE WHEN o.end_time IS NOT NULL THEN EXTRACT(EPOCH FROM (o.end_time - o.start_time))::BIGINT END as duration_seconds,
		       CASE WHEN o.end_time IS NOT NULL AND sla.norm_seconds IS NOT NULL
		            THEN EXTRACT(EPOCH FROM (o.end_time - o.start_time)) > (sla.norm_seconds + COALESCE(sla.threshold_seconds,0))
		            ELSE false END as sla_violation
		FROM operation o
		JOIN employee e ON e.employee_id = o.employee_id
		JOIN operation_type ot ON ot.operation_type_id = o.operation_type_id
		LEFT JOIN sla_regulation sla ON sla.operation_type_id = o.operation_type_id AND sla.is_active = true
		WHERE %s
		ORDER BY o.start_time DESC
		LIMIT 500
	`, strings.Join(where, " AND "))
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []model.Operation
	for rows.Next() {
		var op model.Operation
		if err := rows.Scan(&op.OperationID, &op.EmployeeID, &op.OperationTypeID, &op.StartTime, &op.EndTime, &op.Status,
			&op.EmployeeName, &op.OperationTypeName, &op.DurationSeconds, &op.SLAViolation); err != nil {
			return nil, err
		}
		result = append(result, op)
	}
	return result, nil
}

func (r *CRUDRepository) CreateOperation(ctx context.Context, req model.CreateOperationRequest) (*model.Operation, error) {
	var op model.Operation
	err := r.pool.QueryRow(ctx, `
		INSERT INTO operation (employee_id, operation_type_id, start_time, end_time, status)
		VALUES ($1,$2,$3,$4,$5) RETURNING operation_id, employee_id, operation_type_id, start_time, end_time, status
	`, req.EmployeeID, req.OperationTypeID, req.StartTime, req.EndTime, req.Status,
	).Scan(&op.OperationID, &op.EmployeeID, &op.OperationTypeID, &op.StartTime, &op.EndTime, &op.Status)
	return &op, err
}

// ===== SLA =====

func (r *CRUDRepository) ListSLA(ctx context.Context) ([]model.SLARegulation, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT s.sla_id, s.operation_type_id, s.norm_seconds, s.threshold_seconds, s.is_active, ot.name
		FROM sla_regulation s JOIN operation_type ot ON ot.operation_type_id = s.operation_type_id
		ORDER BY ot.name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []model.SLARegulation
	for rows.Next() {
		var s model.SLARegulation
		if err := rows.Scan(&s.SLAID, &s.OperationTypeID, &s.NormSeconds, &s.ThresholdSeconds, &s.IsActive, &s.OperationTypeName); err != nil {
			return nil, err
		}
		result = append(result, s)
	}
	return result, nil
}

func (r *CRUDRepository) CreateSLA(ctx context.Context, req model.CreateSLARequest) (*model.SLARegulation, error) {
	var s model.SLARegulation
	err := r.pool.QueryRow(ctx, `
		INSERT INTO sla_regulation (operation_type_id, norm_seconds, threshold_seconds, is_active)
		VALUES ($1,$2,$3,$4) RETURNING sla_id, operation_type_id, norm_seconds, threshold_seconds, is_active
	`, req.OperationTypeID, req.NormSeconds, req.ThresholdSeconds, req.IsActive,
	).Scan(&s.SLAID, &s.OperationTypeID, &s.NormSeconds, &s.ThresholdSeconds, &s.IsActive)
	return &s, err
}

func (r *CRUDRepository) UpdateSLA(ctx context.Context, id int64, req model.UpdateSLARequest) (*model.SLARegulation, error) {
	setClauses := []string{}
	args := []interface{}{}
	idx := 1
	if req.NormSeconds != nil {
		setClauses = append(setClauses, fmt.Sprintf("norm_seconds=$%d", idx))
		args = append(args, *req.NormSeconds)
		idx++
	}
	if req.ThresholdSeconds != nil {
		setClauses = append(setClauses, fmt.Sprintf("threshold_seconds=$%d", idx))
		args = append(args, *req.ThresholdSeconds)
		idx++
	}
	if req.IsActive != nil {
		setClauses = append(setClauses, fmt.Sprintf("is_active=$%d", idx))
		args = append(args, *req.IsActive)
		idx++
	}
	if len(setClauses) == 0 {
		return nil, fmt.Errorf("no fields")
	}
	args = append(args, id)
	var s model.SLARegulation
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE sla_regulation SET %s WHERE sla_id=$%d RETURNING sla_id, operation_type_id, norm_seconds, threshold_seconds, is_active`,
			strings.Join(setClauses, ","), idx),
		args...,
	).Scan(&s.SLAID, &s.OperationTypeID, &s.NormSeconds, &s.ThresholdSeconds, &s.IsActive)
	return &s, err
}

// ===== KPI =====

func (r *CRUDRepository) ListKPITemplates(ctx context.Context) ([]model.KPITemplate, error) {
	rows, err := r.pool.Query(ctx, `SELECT kpi_template_id, name, formula, unit FROM kpi_template ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []model.KPITemplate
	for rows.Next() {
		var k model.KPITemplate
		if err := rows.Scan(&k.KPITemplateID, &k.Name, &k.Formula, &k.Unit); err != nil {
			return nil, err
		}
		result = append(result, k)
	}
	return result, nil
}

func (r *CRUDRepository) CreateKPITemplate(ctx context.Context, name, formula string, unit *string) (*model.KPITemplate, error) {
	var k model.KPITemplate
	err := r.pool.QueryRow(ctx,
		`INSERT INTO kpi_template (name, formula, unit) VALUES ($1,$2,$3) RETURNING kpi_template_id, name, formula, unit`,
		name, formula, unit,
	).Scan(&k.KPITemplateID, &k.Name, &k.Formula, &k.Unit)
	return &k, err
}

func (r *CRUDRepository) ListKPIResults(ctx context.Context, employeeID *int64, from, to *string) ([]model.KPIResult, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	idx := 1
	if employeeID != nil {
		where = append(where, fmt.Sprintf("kr.employee_id=$%d", idx))
		args = append(args, *employeeID)
		idx++
	}
	if from != nil {
		where = append(where, fmt.Sprintf("kr.period_date>=$%d", idx))
		args = append(args, *from)
		idx++
	}
	if to != nil {
		where = append(where, fmt.Sprintf("kr.period_date<=$%d", idx))
		args = append(args, *to)
		idx++
	}
	_ = idx
	query := fmt.Sprintf(`
		SELECT kr.kpi_result_id, kr.employee_id, kr.kpi_template_id, kr.period_date::text, kr.value,
		       e.full_name, kt.name, kt.unit
		FROM kpi_result kr
		JOIN employee e ON e.employee_id = kr.employee_id
		JOIN kpi_template kt ON kt.kpi_template_id = kr.kpi_template_id
		WHERE %s ORDER BY kr.period_date DESC, e.full_name LIMIT 1000
	`, strings.Join(where, " AND "))
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []model.KPIResult
	for rows.Next() {
		var k model.KPIResult
		if err := rows.Scan(&k.KPIResultID, &k.EmployeeID, &k.KPITemplateID, &k.PeriodDate, &k.Value, &k.EmployeeName, &k.KPIName, &k.Unit); err != nil {
			return nil, err
		}
		result = append(result, k)
	}
	return result, nil
}

func (r *CRUDRepository) RecalculateKPI(ctx context.Context, date string) error {
	// Recalculate OPS_COUNT
	_, err := r.pool.Exec(ctx, `
		INSERT INTO kpi_result (employee_id, kpi_template_id, period_date, value)
		SELECT o.employee_id, kt.kpi_template_id, $1::date, COUNT(*)::numeric
		FROM operation o, kpi_template kt
		WHERE kt.formula = 'OPS_COUNT' AND DATE(o.start_time) = $1::date AND o.status = 'DONE'
		GROUP BY o.employee_id, kt.kpi_template_id
		ON CONFLICT (employee_id, kpi_template_id, period_date) DO UPDATE SET value = EXCLUDED.value
	`, date)
	if err != nil {
		return err
	}
	// Recalculate AVG_DURATION_SEC
	_, err = r.pool.Exec(ctx, `
		INSERT INTO kpi_result (employee_id, kpi_template_id, period_date, value)
		SELECT o.employee_id, kt.kpi_template_id, $1::date,
		       COALESCE(AVG(EXTRACT(EPOCH FROM (o.end_time - o.start_time))), 0)::numeric
		FROM operation o, kpi_template kt
		WHERE kt.formula = 'AVG_DURATION_SEC' AND DATE(o.start_time) = $1::date AND o.end_time IS NOT NULL AND o.status = 'DONE'
		GROUP BY o.employee_id, kt.kpi_template_id
		ON CONFLICT (employee_id, kpi_template_id, period_date) DO UPDATE SET value = EXCLUDED.value
	`, date)
	if err != nil {
		return err
	}
	// Recalculate SLA_VIOLATIONS_COUNT
	_, err = r.pool.Exec(ctx, `
		INSERT INTO kpi_result (employee_id, kpi_template_id, period_date, value)
		SELECT o.employee_id, kt.kpi_template_id, $1::date, COUNT(*)::numeric
		FROM operation o
		JOIN kpi_template kt ON kt.formula = 'SLA_VIOLATIONS_COUNT'
		JOIN sla_regulation sla ON sla.operation_type_id = o.operation_type_id AND sla.is_active = true
		WHERE DATE(o.start_time) = $1::date AND o.end_time IS NOT NULL AND o.status = 'DONE'
		  AND EXTRACT(EPOCH FROM (o.end_time - o.start_time)) > (sla.norm_seconds + COALESCE(sla.threshold_seconds,0))
		GROUP BY o.employee_id, kt.kpi_template_id
		ON CONFLICT (employee_id, kpi_template_id, period_date) DO UPDATE SET value = EXCLUDED.value
	`, date)
	return err
}

// ===== TASKS =====

type TaskFilter struct {
	AssigneeID *int64
	Status     *string
}

func (r *CRUDRepository) ListTasks(ctx context.Context, f TaskFilter) ([]model.Task, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	idx := 1
	if f.AssigneeID != nil {
		where = append(where, fmt.Sprintf("t.assignee_id=$%d", idx))
		args = append(args, *f.AssigneeID)
		idx++
	}
	if f.Status != nil {
		where = append(where, fmt.Sprintf("t.status=$%d", idx))
		args = append(args, *f.Status)
		idx++
	}
	_ = idx
	query := fmt.Sprintf(`
		SELECT t.task_id, t.assignee_id, t.creator_id, t.title, t.description, t.due_date::text, t.status, t.created_at, t.updated_at,
		       a.full_name as assignee_name, c.full_name as creator_name
		FROM task t
		JOIN employee a ON a.employee_id = t.assignee_id
		JOIN employee c ON c.employee_id = t.creator_id
		WHERE %s ORDER BY t.created_at DESC
	`, strings.Join(where, " AND "))
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []model.Task
	for rows.Next() {
		var t model.Task
		if err := rows.Scan(&t.TaskID, &t.AssigneeID, &t.CreatorID, &t.Title, &t.Description, &t.DueDate, &t.Status, &t.CreatedAt, &t.UpdatedAt, &t.AssigneeName, &t.CreatorName); err != nil {
			return nil, err
		}
		result = append(result, t)
	}
	return result, nil
}

func (r *CRUDRepository) CreateTask(ctx context.Context, req model.CreateTaskRequest, creatorID int64) (*model.Task, error) {
	var t model.Task
	err := r.pool.QueryRow(ctx, `
		INSERT INTO task (assignee_id, creator_id, title, description, due_date, status)
		VALUES ($1,$2,$3,$4,$5::date,'ASSIGNED')
		RETURNING task_id, assignee_id, creator_id, title, description, due_date::text, status, created_at, updated_at
	`, req.AssigneeID, creatorID, req.Title, req.Description, req.DueDate,
	).Scan(&t.TaskID, &t.AssigneeID, &t.CreatorID, &t.Title, &t.Description, &t.DueDate, &t.Status, &t.CreatedAt, &t.UpdatedAt)
	return &t, err
}

func (r *CRUDRepository) UpdateTask(ctx context.Context, id int64, req model.UpdateTaskRequest) (*model.Task, error) {
	setClauses := []string{"updated_at=now()"}
	args := []interface{}{}
	idx := 1
	if req.Status != nil {
		setClauses = append(setClauses, fmt.Sprintf("status=$%d", idx))
		args = append(args, *req.Status)
		idx++
	}
	if req.Description != nil {
		setClauses = append(setClauses, fmt.Sprintf("description=$%d", idx))
		args = append(args, *req.Description)
		idx++
	}
	if req.DueDate != nil {
		setClauses = append(setClauses, fmt.Sprintf("due_date=$%d::date", idx))
		args = append(args, *req.DueDate)
		idx++
	}
	args = append(args, id)
	var t model.Task
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE task SET %s WHERE task_id=$%d RETURNING task_id, assignee_id, creator_id, title, description, due_date::text, status, created_at, updated_at`,
			strings.Join(setClauses, ","), idx),
		args...,
	).Scan(&t.TaskID, &t.AssigneeID, &t.CreatorID, &t.Title, &t.Description, &t.DueDate, &t.Status, &t.CreatedAt, &t.UpdatedAt)
	return &t, err
}

// ===== WORK SCHEDULE =====

func (r *CRUDRepository) ListSchedule(ctx context.Context, employeeID *int64, from, to *string) ([]model.WorkSchedule, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	idx := 1
	if employeeID != nil {
		where = append(where, fmt.Sprintf("ws.employee_id=$%d", idx))
		args = append(args, *employeeID)
		idx++
	}
	if from != nil {
		where = append(where, fmt.Sprintf("ws.work_date>=$%d::date", idx))
		args = append(args, *from)
		idx++
	}
	if to != nil {
		where = append(where, fmt.Sprintf("ws.work_date<=$%d::date", idx))
		args = append(args, *to)
		idx++
	}
	_ = idx
	query := fmt.Sprintf(`
		SELECT ws.schedule_id, ws.employee_id, ws.work_date::text,
		       ws.start_time::text, ws.end_time::text, ws.shift_type, e.full_name
		FROM work_schedule ws JOIN employee e ON e.employee_id = ws.employee_id
		WHERE %s ORDER BY ws.work_date DESC, e.full_name
	`, strings.Join(where, " AND "))
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []model.WorkSchedule
	for rows.Next() {
		var ws model.WorkSchedule
		if err := rows.Scan(&ws.ScheduleID, &ws.EmployeeID, &ws.WorkDate, &ws.StartTime, &ws.EndTime, &ws.ShiftType, &ws.EmployeeName); err != nil {
			return nil, err
		}
		result = append(result, ws)
	}
	return result, nil
}

func (r *CRUDRepository) CreateSchedule(ctx context.Context, req model.CreateScheduleRequest) (*model.WorkSchedule, error) {
	shiftType := req.ShiftType
	if shiftType == "" {
		shiftType = "WORK"
	}
	var ws model.WorkSchedule
	err := r.pool.QueryRow(ctx, `
		INSERT INTO work_schedule (employee_id, work_date, start_time, end_time, shift_type)
		VALUES ($1,$2::date,$3::time,$4::time,$5)
		ON CONFLICT (employee_id, work_date) DO UPDATE
		  SET start_time=$3::time, end_time=$4::time, shift_type=$5
		RETURNING schedule_id, employee_id, work_date::text, start_time::text, end_time::text, shift_type
	`, req.EmployeeID, req.WorkDate, req.StartTime, req.EndTime, shiftType,
	).Scan(&ws.ScheduleID, &ws.EmployeeID, &ws.WorkDate, &ws.StartTime, &ws.EndTime, &ws.ShiftType)
	return &ws, err
}

func (r *CRUDRepository) UpdateSchedule(ctx context.Context, id int64, req model.UpdateScheduleRequest) (*model.WorkSchedule, error) {
	setClauses := []string{}
	args := []interface{}{}
	idx := 1
	if req.ShiftType != nil {
		setClauses = append(setClauses, fmt.Sprintf("shift_type=$%d", idx))
		args = append(args, *req.ShiftType)
		idx++
	}
	if req.StartTime != nil {
		setClauses = append(setClauses, fmt.Sprintf("start_time=$%d::time", idx))
		args = append(args, *req.StartTime)
		idx++
	}
	if req.EndTime != nil {
		setClauses = append(setClauses, fmt.Sprintf("end_time=$%d::time", idx))
		args = append(args, *req.EndTime)
		idx++
	}
	if len(setClauses) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}
	args = append(args, id)
	var ws model.WorkSchedule
	err := r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE work_schedule SET %s WHERE schedule_id=$%d
		RETURNING schedule_id, employee_id, work_date::text, start_time::text, end_time::text, shift_type`,
			strings.Join(setClauses, ","), idx),
		args...,
	).Scan(&ws.ScheduleID, &ws.EmployeeID, &ws.WorkDate, &ws.StartTime, &ws.EndTime, &ws.ShiftType)
	return &ws, err
}

func (r *CRUDRepository) DeleteSchedule(ctx context.Context, id int64) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM work_schedule WHERE schedule_id=$1`, id)
	return err
}

// GetDailyTrend возвращает статистику по дням за последние N дней
func (r *CRUDRepository) GetDailyTrend(ctx context.Context, days int) ([]model.DailyTrendPoint, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT
			d.day::date::text,
			COUNT(o.operation_id) AS ops_count,
			COUNT(CASE WHEN o.end_time IS NOT NULL
			  AND sla.norm_seconds IS NOT NULL
			  AND EXTRACT(EPOCH FROM (o.end_time - o.start_time)) > (sla.norm_seconds + COALESCE(sla.threshold_seconds,0))
			  THEN 1 END) AS sla_violations,
			COALESCE(AVG(CASE WHEN o.end_time IS NOT NULL
			  THEN EXTRACT(EPOCH FROM (o.end_time - o.start_time)) END), 0) AS avg_duration
		FROM generate_series(
			(NOW() - make_interval(days => $1))::date,
			NOW()::date,
			'1 day'::interval
		) AS d(day)
		LEFT JOIN operation o ON DATE(o.start_time) = d.day::date AND o.status = 'DONE'
		LEFT JOIN sla_regulation sla ON sla.operation_type_id = o.operation_type_id AND sla.is_active = TRUE
		GROUP BY d.day
		ORDER BY d.day
	`, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []model.DailyTrendPoint
	for rows.Next() {
		var p model.DailyTrendPoint
		if err := rows.Scan(&p.Date, &p.OperationsCount, &p.SLAViolations, &p.AvgDurationSeconds); err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, nil
}

// GetOpTypeDistribution возвращает распределение операций по типам за дату
func (r *CRUDRepository) GetOpTypeDistribution(ctx context.Context, date string) ([]model.OpTypeCount, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT ot.name, COUNT(o.operation_id)::int AS cnt
		FROM operation_type ot
		LEFT JOIN operation o ON o.operation_type_id = ot.operation_type_id
			AND DATE(o.start_time) = $1::date
		GROUP BY ot.name
		ORDER BY cnt DESC
	`, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []model.OpTypeCount
	for rows.Next() {
		var item model.OpTypeCount
		if err := rows.Scan(&item.Name, &item.Count); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, nil
}

// ===== AUDIT =====

func (r *CRUDRepository) ListAudit(ctx context.Context, employeeID *int64, from, to *string) ([]model.AuditLog, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	idx := 1
	if employeeID != nil {
		where = append(where, fmt.Sprintf("al.employee_id=$%d", idx))
		args = append(args, *employeeID)
		idx++
	}
	if from != nil {
		where = append(where, fmt.Sprintf("al.created_at>=$%d", idx))
		args = append(args, *from)
		idx++
	}
	if to != nil {
		where = append(where, fmt.Sprintf("al.created_at<$%d", idx))
		args = append(args, *to)
		idx++
	}
	_ = idx
	query := fmt.Sprintf(`
		SELECT al.audit_id, al.employee_id, al.action, al.created_at, al.ip, e.full_name
		FROM audit_log al LEFT JOIN employee e ON e.employee_id = al.employee_id
		WHERE %s ORDER BY al.created_at DESC LIMIT 1000
	`, strings.Join(where, " AND "))
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []model.AuditLog
	for rows.Next() {
		var a model.AuditLog
		if err := rows.Scan(&a.AuditID, &a.EmployeeID, &a.Action, &a.CreatedAt, &a.IP, &a.EmployeeName); err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, nil
}

func (r *CRUDRepository) CreateAuditLog(ctx context.Context, employeeID *int64, action, ip string) {
	_, _ = r.pool.Exec(ctx, `INSERT INTO audit_log (employee_id, action, ip) VALUES ($1,$2,$3)`, employeeID, action, ip)
}

// ===== DASHBOARD =====

func (r *CRUDRepository) GetDashboardHead(ctx context.Context, date string) (*model.DashboardHeadResponse, error) {
	resp := &model.DashboardHeadResponse{}
	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM employee WHERE role='EMP'`).Scan(&resp.TotalEmployees)
	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM operation WHERE DATE(start_time)=$1::date`, date).Scan(&resp.OperationsToday)
	_ = r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM operation o
		JOIN sla_regulation s ON s.operation_type_id = o.operation_type_id AND s.is_active = true
		WHERE DATE(o.start_time)=$1::date AND o.end_time IS NOT NULL
		  AND EXTRACT(EPOCH FROM (o.end_time - o.start_time)) > (s.norm_seconds + COALESCE(s.threshold_seconds,0))
	`, date).Scan(&resp.SLAViolationsToday)
	_ = r.pool.QueryRow(ctx, `
		SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (end_time - start_time))),0)
		FROM operation WHERE DATE(start_time)=$1::date AND end_time IS NOT NULL AND status='DONE'
	`, date).Scan(&resp.AvgDurationToday)
	kpi, _ := r.ListKPIResults(ctx, nil, &date, &date)
	if kpi == nil {
		kpi = []model.KPIResult{}
	}
	resp.KPIResults = kpi
	return resp, nil
}

func (r *CRUDRepository) GetDashboardEmployee(ctx context.Context, employeeID int64, date string) (*model.DashboardEmployeeResponse, error) {
	resp := &model.DashboardEmployeeResponse{}
	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM operation WHERE employee_id=$1 AND DATE(start_time)=$2::date`, employeeID, date).Scan(&resp.OperationsToday)
	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM task WHERE assignee_id=$1 AND status NOT IN ('DONE','CANCELED')`, employeeID).Scan(&resp.TasksPending)
	_ = r.pool.QueryRow(ctx, `
		SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (end_time - start_time))),0)
		FROM operation WHERE employee_id=$1 AND DATE(start_time)=$2::date AND end_time IS NOT NULL AND status='DONE'
	`, employeeID, date).Scan(&resp.AvgDuration)
	kpi, _ := r.ListKPIResults(ctx, &employeeID, &date, &date)
	if kpi == nil {
		kpi = []model.KPIResult{}
	}
	resp.KPIResults = kpi
	var ws model.WorkSchedule
	err := r.pool.QueryRow(ctx, `
		SELECT schedule_id, employee_id, work_date::text, start_time::text, end_time::text
		FROM work_schedule WHERE employee_id=$1 AND work_date=$2::date
	`, employeeID, date).Scan(&ws.ScheduleID, &ws.EmployeeID, &ws.WorkDate, &ws.StartTime, &ws.EndTime)
	if err == nil {
		resp.TodaySchedule = &ws
	}
	return resp, nil
}
