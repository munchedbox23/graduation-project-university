package model

import "time"

type Department struct {
	DepartmentID int64  `json:"department_id" db:"department_id"`
	Name         string `json:"name" db:"name"`
	Phone        string `json:"phone" db:"phone"`
}

type OperationType struct {
	OperationTypeID int64   `json:"operation_type_id" db:"operation_type_id"`
	Name            string  `json:"name" db:"name"`
	Category        *string `json:"category" db:"category"`
}

type Operation struct {
	OperationID     int64      `json:"operation_id" db:"operation_id"`
	EmployeeID      int64      `json:"employee_id" db:"employee_id"`
	OperationTypeID int64      `json:"operation_type_id" db:"operation_type_id"`
	StartTime       time.Time  `json:"start_time" db:"start_time"`
	EndTime         *time.Time `json:"end_time" db:"end_time"`
	Status          string     `json:"status" db:"status"`
	// joined fields
	EmployeeName      *string `json:"employee_name,omitempty" db:"employee_name"`
	OperationTypeName *string `json:"operation_type_name,omitempty" db:"operation_type_name"`
	DurationSeconds   *int64  `json:"duration_seconds,omitempty" db:"duration_seconds"`
	SLAViolation      *bool   `json:"sla_violation,omitempty" db:"sla_violation"`
}

type SLARegulation struct {
	SLAID            int64   `json:"sla_id" db:"sla_id"`
	OperationTypeID  int64   `json:"operation_type_id" db:"operation_type_id"`
	NormSeconds      int     `json:"norm_seconds" db:"norm_seconds"`
	ThresholdSeconds int     `json:"threshold_seconds" db:"threshold_seconds"`
	IsActive         bool    `json:"is_active" db:"is_active"`
	OperationTypeName *string `json:"operation_type_name,omitempty" db:"operation_type_name"`
}

type KPITemplate struct {
	KPITemplateID int64   `json:"kpi_template_id" db:"kpi_template_id"`
	Name          string  `json:"name" db:"name"`
	Formula       string  `json:"formula" db:"formula"`
	Unit          *string `json:"unit" db:"unit"`
}

type KPIResult struct {
	KPIResultID   int64   `json:"kpi_result_id" db:"kpi_result_id"`
	EmployeeID    int64   `json:"employee_id" db:"employee_id"`
	KPITemplateID int64   `json:"kpi_template_id" db:"kpi_template_id"`
	PeriodDate    string  `json:"period_date" db:"period_date"`
	Value         float64 `json:"value" db:"value"`
	// joined
	EmployeeName *string `json:"employee_name,omitempty" db:"employee_name"`
	KPIName      *string `json:"kpi_name,omitempty" db:"kpi_name"`
	Unit         *string `json:"unit,omitempty" db:"unit"`
}

type Task struct {
	TaskID      int64     `json:"task_id" db:"task_id"`
	AssigneeID  int64     `json:"assignee_id" db:"assignee_id"`
	CreatorID   int64     `json:"creator_id" db:"creator_id"`
	Title       string    `json:"title" db:"title"`
	Description *string   `json:"description" db:"description"`
	DueDate     *string   `json:"due_date" db:"due_date"`
	Status      string    `json:"status" db:"status"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
	AssigneeName *string  `json:"assignee_name,omitempty" db:"assignee_name"`
	CreatorName  *string  `json:"creator_name,omitempty" db:"creator_name"`
}

type WorkSchedule struct {
	ScheduleID   int64   `json:"schedule_id" db:"schedule_id"`
	EmployeeID   int64   `json:"employee_id" db:"employee_id"`
	WorkDate     string  `json:"work_date" db:"work_date"`
	StartTime    *string `json:"start_time" db:"start_time"`
	EndTime      *string `json:"end_time" db:"end_time"`
	ShiftType    string  `json:"shift_type" db:"shift_type"`
	EmployeeName *string `json:"employee_name,omitempty" db:"employee_name"`
}

type AuditLog struct {
	AuditID      int64     `json:"audit_id" db:"audit_id"`
	EmployeeID   *int64    `json:"employee_id" db:"employee_id"`
	Action       string    `json:"action" db:"action"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	IP           *string   `json:"ip" db:"ip"`
	EmployeeName *string   `json:"employee_name,omitempty" db:"employee_name"`
}

// --- Request/Response DTOs ---

type CreateEmployeeRequest struct {
	DepartmentID    int64   `json:"department_id"`
	FullName        string  `json:"full_name"`
	Position        string  `json:"position"`
	Phone           string  `json:"phone"`
	Email           string  `json:"email"`
	Password        string  `json:"password"`
	Salary          float64 `json:"salary"`
	ExperienceYears int     `json:"experience_years"`
	Role            Role    `json:"role"`
}

type UpdateEmployeeRequest struct {
	FullName        *string  `json:"full_name"`
	Position        *string  `json:"position"`
	Phone           *string  `json:"phone"`
	Email           *string  `json:"email"`
	Salary          *float64 `json:"salary"`
	ExperienceYears *int     `json:"experience_years"`
	Role            *Role    `json:"role"`
	DepartmentID    *int64   `json:"department_id"`
}

type CreateOperationRequest struct {
	EmployeeID      int64      `json:"employee_id"`
	OperationTypeID int64      `json:"operation_type_id"`
	StartTime       time.Time  `json:"start_time"`
	EndTime         *time.Time `json:"end_time"`
	Status          string     `json:"status"`
}

type CreateTaskRequest struct {
	AssigneeID  int64   `json:"assignee_id"`
	Title       string  `json:"title"`
	Description *string `json:"description"`
	DueDate     *string `json:"due_date"`
}

type UpdateTaskRequest struct {
	Status      *string `json:"status"`
	Description *string `json:"description"`
	DueDate     *string `json:"due_date"`
}

type CreateSLARequest struct {
	OperationTypeID  int64 `json:"operation_type_id"`
	NormSeconds      int   `json:"norm_seconds"`
	ThresholdSeconds int   `json:"threshold_seconds"`
	IsActive         bool  `json:"is_active"`
}

type UpdateSLARequest struct {
	NormSeconds      *int  `json:"norm_seconds"`
	ThresholdSeconds *int  `json:"threshold_seconds"`
	IsActive         *bool `json:"is_active"`
}

type CreateScheduleRequest struct {
	EmployeeID int64   `json:"employee_id"`
	WorkDate   string  `json:"work_date"`
	StartTime  *string `json:"start_time"`
	EndTime    *string `json:"end_time"`
	ShiftType  string  `json:"shift_type"`
}

type UpdateScheduleRequest struct {
	StartTime *string `json:"start_time"`
	EndTime   *string `json:"end_time"`
	ShiftType *string `json:"shift_type"`
}

// OpTypeCount — количество операций по типу
type OpTypeCount struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

// DailyTrendPoint — точка тренда для графиков
type DailyTrendPoint struct {
	Date               string  `json:"date"`
	OperationsCount    int64   `json:"operations_count"`
	SLAViolations      int64   `json:"sla_violations"`
	AvgDurationSeconds float64 `json:"avg_duration_seconds"`
}

type ListResponse[T any] struct {
	Data  []T `json:"data"`
	Total int `json:"total"`
}

type DashboardHeadResponse struct {
	TotalEmployees     int64       `json:"total_employees"`
	OperationsToday    int64       `json:"operations_today"`
	SLAViolationsToday int64       `json:"sla_violations_today"`
	AvgDurationToday   float64     `json:"avg_duration_today"`
	KPIResults         []KPIResult `json:"kpi_results"`
}

type DashboardEmployeeResponse struct {
	OperationsToday int64         `json:"operations_today"`
	TasksPending    int64         `json:"tasks_pending"`
	AvgDuration     float64       `json:"avg_duration"`
	KPIResults      []KPIResult   `json:"kpi_results"`
	TodaySchedule   *WorkSchedule `json:"today_schedule"`
}
