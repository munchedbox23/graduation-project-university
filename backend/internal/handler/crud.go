package handler

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"bank-ops-monitor/internal/middleware"
	"bank-ops-monitor/internal/model"
	"bank-ops-monitor/internal/repository"
)

// ===== DEPARTMENTS =====

func (h *Handler) ListDepartments(w http.ResponseWriter, r *http.Request) {
	data, err := h.crudRepo.ListDepartments(r.Context())
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, model.ListResponse[model.Department]{Data: coalesce(data), Total: len(data)})
}

func (h *Handler) CreateDepartment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name  string `json:"name"`
		Phone string `json:"phone"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "invalid body")
		return
	}
	d, err := h.crudRepo.CreateDepartment(r.Context(), req.Name, req.Phone)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	h.auditAction(r, "CREATE_DEPARTMENT")
	writeJSON(w, 201, d)
}

// ===== EMPLOYEES =====

func (h *Handler) ListEmployees(w http.ResponseWriter, r *http.Request) {
	data, err := h.crudRepo.ListEmployees(r.Context())
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, model.ListResponse[model.Employee]{Data: coalesce(data), Total: len(data)})
}

func (h *Handler) CreateEmployee(w http.ResponseWriter, r *http.Request) {
	var req model.CreateEmployeeRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "invalid body")
		return
	}
	e, err := h.crudRepo.CreateEmployee(r.Context(), req)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	h.auditAction(r, "CREATE_EMPLOYEE:"+req.Email)
	writeJSON(w, 201, e)
}

func (h *Handler) UpdateEmployee(w http.ResponseWriter, r *http.Request) {
	id, err := parseIDFromPath(r, "id")
	if err != nil {
		writeError(w, 400, "invalid id")
		return
	}
	var req model.UpdateEmployeeRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "invalid body")
		return
	}
	e, err := h.crudRepo.UpdateEmployee(r.Context(), id, req)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	h.auditAction(r, fmt.Sprintf("UPDATE_EMPLOYEE:%d", id))
	writeJSON(w, 200, e)
}

// ===== OPERATION TYPES =====

func (h *Handler) ListOperationTypes(w http.ResponseWriter, r *http.Request) {
	data, err := h.crudRepo.ListOperationTypes(r.Context())
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, model.ListResponse[model.OperationType]{Data: coalesce(data), Total: len(data)})
}

func (h *Handler) CreateOperationType(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name     string  `json:"name"`
		Category *string `json:"category"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "invalid body")
		return
	}
	ot, err := h.crudRepo.CreateOperationType(r.Context(), req.Name, req.Category)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	h.auditAction(r, "CREATE_OP_TYPE:"+req.Name)
	writeJSON(w, 201, ot)
}

// ===== OPERATIONS =====

func (h *Handler) ListOperations(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	q := r.URL.Query()
	f := repository.OperationFilter{}
	if v := q.Get("employee_id"); v != "" {
		if id, err := strconv.ParseInt(v, 10, 64); err == nil {
			f.EmployeeID = &id
		}
	}
	// EMP can only see own operations
	if claims != nil && claims.Role == model.RoleEmp {
		f.EmployeeID = &claims.EmployeeID
	}
	if v := q.Get("type_id"); v != "" {
		if id, err := strconv.ParseInt(v, 10, 64); err == nil {
			f.OperationTypeID = &id
		}
	}
	if v := q.Get("from"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			f.From = &t
		}
	}
	if v := q.Get("to"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			t2 := t.Add(24 * time.Hour)
			f.To = &t2
		}
	}
	if v := q.Get("status"); v != "" {
		f.Status = &v
	}
	data, err := h.crudRepo.ListOperations(r.Context(), f)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, model.ListResponse[model.Operation]{Data: coalesce(data), Total: len(data)})
}

func (h *Handler) CreateOperation(w http.ResponseWriter, r *http.Request) {
	var req model.CreateOperationRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "invalid body")
		return
	}
	if req.Status == "" {
		req.Status = "DONE"
	}
	op, err := h.crudRepo.CreateOperation(r.Context(), req)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 201, op)
}

func (h *Handler) ImportOperations(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		writeError(w, 400, "parse form")
		return
	}
	file, _, err := r.FormFile("file")
	if err != nil {
		writeError(w, 400, "file required")
		return
	}
	defer file.Close()
	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		writeError(w, 400, "invalid csv")
		return
	}

	type ImportResult struct {
		Row     int              `json:"row"`
		Success bool             `json:"success"`
		Error   string           `json:"error,omitempty"`
		Data    *model.Operation `json:"data,omitempty"`
	}
	results := []ImportResult{}

	// Find employees and operation types by email/phone/name
	empMap := map[string]int64{}
	otMap := map[string]int64{}
	employees, _ := h.crudRepo.ListEmployees(r.Context())
	for _, e := range employees {
		if e.Email != nil {
			empMap[*e.Email] = e.EmployeeID
		}
		empMap[e.Phone] = e.EmployeeID
	}
	ots, _ := h.crudRepo.ListOperationTypes(r.Context())
	for _, ot := range ots {
		otMap[strings.ToLower(ot.Name)] = ot.OperationTypeID
	}

	for i, record := range records {
		if i == 0 {
			continue // skip header
		}
		if len(record) < 4 {
			results = append(results, ImportResult{Row: i + 1, Success: false, Error: "insufficient columns"})
			continue
		}
		empID, ok := empMap[record[0]]
		if !ok {
			results = append(results, ImportResult{Row: i + 1, Success: false, Error: "unknown employee: " + record[0]})
			continue
		}
		otID, ok := otMap[strings.ToLower(record[1])]
		if !ok {
			results = append(results, ImportResult{Row: i + 1, Success: false, Error: "unknown operation type: " + record[1]})
			continue
		}
		startTime, err := time.Parse(time.RFC3339, record[2])
		if err != nil {
			results = append(results, ImportResult{Row: i + 1, Success: false, Error: "invalid start_time"})
			continue
		}
		var endTime *time.Time
		if record[3] != "" {
			t, err := time.Parse(time.RFC3339, record[3])
			if err != nil {
				results = append(results, ImportResult{Row: i + 1, Success: false, Error: "invalid end_time"})
				continue
			}
			if t.Before(startTime) {
				results = append(results, ImportResult{Row: i + 1, Success: false, Error: "end_time before start_time"})
				continue
			}
			endTime = &t
		}
		status := "DONE"
		if len(record) > 4 && record[4] != "" {
			status = record[4]
		}
		op, err := h.crudRepo.CreateOperation(r.Context(), model.CreateOperationRequest{
			EmployeeID: empID, OperationTypeID: otID, StartTime: startTime, EndTime: endTime, Status: status,
		})
		if err != nil {
			results = append(results, ImportResult{Row: i + 1, Success: false, Error: err.Error()})
			continue
		}
		results = append(results, ImportResult{Row: i + 1, Success: true, Data: op})
	}
	h.auditAction(r, fmt.Sprintf("IMPORT_OPERATIONS: %d rows", len(results)))
	writeJSON(w, 200, map[string]interface{}{"results": results, "total": len(results)})
}

// ===== SLA =====

func (h *Handler) ListSLA(w http.ResponseWriter, r *http.Request) {
	data, err := h.crudRepo.ListSLA(r.Context())
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, model.ListResponse[model.SLARegulation]{Data: coalesce(data), Total: len(data)})
}

func (h *Handler) CreateSLA(w http.ResponseWriter, r *http.Request) {
	var req model.CreateSLARequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "invalid body")
		return
	}
	s, err := h.crudRepo.CreateSLA(r.Context(), req)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	h.auditAction(r, "CREATE_SLA")
	writeJSON(w, 201, s)
}

func (h *Handler) UpdateSLA(w http.ResponseWriter, r *http.Request) {
	id, err := parseIDFromPath(r, "id")
	if err != nil {
		writeError(w, 400, "invalid id")
		return
	}
	var req model.UpdateSLARequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "invalid body")
		return
	}
	s, err := h.crudRepo.UpdateSLA(r.Context(), id, req)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, s)
}

// ===== KPI =====

func (h *Handler) ListKPITemplates(w http.ResponseWriter, r *http.Request) {
	data, err := h.crudRepo.ListKPITemplates(r.Context())
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, model.ListResponse[model.KPITemplate]{Data: coalesce(data), Total: len(data)})
}

func (h *Handler) CreateKPITemplate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name    string  `json:"name"`
		Formula string  `json:"formula"`
		Unit    *string `json:"unit"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "invalid body")
		return
	}
	k, err := h.crudRepo.CreateKPITemplate(r.Context(), req.Name, req.Formula, req.Unit)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	h.auditAction(r, "CREATE_KPI_TEMPLATE:"+req.Name)
	writeJSON(w, 201, k)
}

func (h *Handler) ListKPIResults(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	claims := middleware.GetClaims(r)
	var employeeID *int64
	if v := q.Get("employee_id"); v != "" {
		if id, err := strconv.ParseInt(v, 10, 64); err == nil {
			employeeID = &id
		}
	}
	if claims != nil && claims.Role == model.RoleEmp {
		employeeID = &claims.EmployeeID
	}
	from := q.Get("from")
	to := q.Get("to")
	var fromP, toP *string
	if from != "" {
		fromP = &from
	}
	if to != "" {
		toP = &to
	}
	data, err := h.crudRepo.ListKPIResults(r.Context(), employeeID, fromP, toP)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, model.ListResponse[model.KPIResult]{Data: coalesce(data), Total: len(data)})
}

func (h *Handler) RecalculateKPI(w http.ResponseWriter, r *http.Request) {
	date := r.URL.Query().Get("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}
	if err := h.crudRepo.RecalculateKPI(r.Context(), date); err != nil {
		writeError(w, 500, err.Error())
		return
	}
	h.auditAction(r, "RECALCULATE_KPI:"+date)
	writeJSON(w, 200, map[string]string{"status": "ok", "date": date})
}

// ===== TASKS =====

func (h *Handler) ListTasks(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	q := r.URL.Query()
	f := repository.TaskFilter{}
	if v := q.Get("assignee_id"); v != "" {
		if id, err := strconv.ParseInt(v, 10, 64); err == nil {
			f.AssigneeID = &id
		}
	}
	if claims != nil && claims.Role == model.RoleEmp {
		f.AssigneeID = &claims.EmployeeID
	}
	if v := q.Get("status"); v != "" {
		f.Status = &v
	}
	data, err := h.crudRepo.ListTasks(r.Context(), f)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, model.ListResponse[model.Task]{Data: coalesce(data), Total: len(data)})
}

func (h *Handler) CreateTask(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		writeError(w, 401, "unauthorized")
		return
	}
	var req model.CreateTaskRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "invalid body")
		return
	}
	t, err := h.crudRepo.CreateTask(r.Context(), req, claims.EmployeeID)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	h.auditAction(r, "CREATE_TASK:"+req.Title)
	writeJSON(w, 201, t)
}

func (h *Handler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	id, err := parseIDFromPath(r, "id")
	if err != nil {
		writeError(w, 400, "invalid id")
		return
	}
	var req model.UpdateTaskRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "invalid body")
		return
	}
	t, err := h.crudRepo.UpdateTask(r.Context(), id, req)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, t)
}

// ===== SCHEDULE =====

func (h *Handler) ListSchedule(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	q := r.URL.Query()
	var employeeID *int64
	if v := q.Get("employee_id"); v != "" {
		if id, err := strconv.ParseInt(v, 10, 64); err == nil {
			employeeID = &id
		}
	}
	if claims != nil && claims.Role == model.RoleEmp {
		employeeID = &claims.EmployeeID
	}
	from := q.Get("from")
	to := q.Get("to")
	var fromP, toP *string
	if from != "" {
		fromP = &from
	}
	if to != "" {
		toP = &to
	}
	data, err := h.crudRepo.ListSchedule(r.Context(), employeeID, fromP, toP)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, model.ListResponse[model.WorkSchedule]{Data: coalesce(data), Total: len(data)})
}

func (h *Handler) CreateSchedule(w http.ResponseWriter, r *http.Request) {
	var req model.CreateScheduleRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "invalid body")
		return
	}
	ws, err := h.crudRepo.CreateSchedule(r.Context(), req)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, ws)
}

func (h *Handler) UpdateSchedule(w http.ResponseWriter, r *http.Request) {
	id, err := parseIDFromPath(r, "id")
	if err != nil {
		writeError(w, 400, "invalid id")
		return
	}
	var req model.UpdateScheduleRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, 400, "invalid body")
		return
	}
	ws, err := h.crudRepo.UpdateSchedule(r.Context(), id, req)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, ws)
}

func (h *Handler) DeleteSchedule(w http.ResponseWriter, r *http.Request) {
	id, err := parseIDFromPath(r, "id")
	if err != nil {
		writeError(w, 400, "invalid id")
		return
	}
	if err := h.crudRepo.DeleteSchedule(r.Context(), id); err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (h *Handler) DashboardOpTypes(w http.ResponseWriter, r *http.Request) {
	date := r.URL.Query().Get("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}
	data, err := h.crudRepo.GetOpTypeDistribution(r.Context(), date)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	if data == nil {
		data = []model.OpTypeCount{}
	}
	writeJSON(w, 200, data)
}

func (h *Handler) DashboardTrend(w http.ResponseWriter, r *http.Request) {
	days := 7
	if d := r.URL.Query().Get("days"); d != "" {
		if n, err := strconv.Atoi(d); err == nil && n > 0 && n <= 90 {
			days = n
		}
	}
	data, err := h.crudRepo.GetDailyTrend(r.Context(), days)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	if data == nil {
		data = []model.DailyTrendPoint{}
	}
	writeJSON(w, 200, data)
}

// ===== AUDIT =====

func (h *Handler) ListAudit(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	var employeeID *int64
	if v := q.Get("employee_id"); v != "" {
		if id, err := strconv.ParseInt(v, 10, 64); err == nil {
			employeeID = &id
		}
	}
	from := q.Get("from")
	to := q.Get("to")
	var fromP, toP *string
	if from != "" {
		fromP = &from
	}
	if to != "" {
		toP = &to
	}
	data, err := h.crudRepo.ListAudit(r.Context(), employeeID, fromP, toP)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, model.ListResponse[model.AuditLog]{Data: coalesce(data), Total: len(data)})
}

// ===== DASHBOARD + REPORTS =====

func (h *Handler) DashboardHead(w http.ResponseWriter, r *http.Request) {
	date := r.URL.Query().Get("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}
	data, err := h.crudRepo.GetDashboardHead(r.Context(), date)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, data)
}

func (h *Handler) DashboardEmployee(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		writeError(w, 401, "unauthorized")
		return
	}
	date := r.URL.Query().Get("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}
	data, err := h.crudRepo.GetDashboardEmployee(r.Context(), claims.EmployeeID, date)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, data)
}

func (h *Handler) ReportDaily(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	date := q.Get("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}
	export := q.Get("export")
	data, err := h.crudRepo.GetDashboardHead(r.Context(), date)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	if export == "csv" {
		w.Header().Set("Content-Type", "text/csv")
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=report_%s.csv", date))
		cw := csv.NewWriter(w)
		_ = cw.Write([]string{"employee_id", "kpi_name", "value", "unit", "period_date"})
		for _, k := range data.KPIResults {
			name := ""
			if k.KPIName != nil {
				name = *k.KPIName
			}
			unit := ""
			if k.Unit != nil {
				unit = *k.Unit
			}
			_ = cw.Write([]string{strconv.FormatInt(k.EmployeeID, 10), name, fmt.Sprintf("%.2f", k.Value), unit, k.PeriodDate})
		}
		cw.Flush()
		return
	}
	writeJSON(w, 200, data)
}

// ===== HELPERS =====

func parseIDFromPath(r *http.Request, param string) (int64, error) {
	// chi URL parameter
	s := r.PathValue(param)
	if s == "" {
		// fallback: parse from URL path
		parts := strings.Split(r.URL.Path, "/")
		s = parts[len(parts)-1]
	}
	return strconv.ParseInt(s, 10, 64)
}

func (h *Handler) auditAction(r *http.Request, action string) {
	claims := middleware.GetClaims(r)
	ip := r.RemoteAddr
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		ip = forwarded
	}
	var empID *int64
	if claims != nil {
		empID = &claims.EmployeeID
	}
	h.crudRepo.CreateAuditLog(r.Context(), empID, action, ip)
}

func coalesce[T any](s []T) []T {
	if s == nil {
		return []T{}
	}
	return s
}
