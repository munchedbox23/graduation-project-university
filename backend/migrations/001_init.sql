-- =========================================
-- 1) Department
-- =========================================
CREATE TABLE IF NOT EXISTS department (
  department_id BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL UNIQUE
);

-- =========================================
-- 2) Employee (auth fields встроены)
-- =========================================
CREATE TABLE IF NOT EXISTS employee (
  employee_id       BIGSERIAL PRIMARY KEY,
  department_id     BIGINT NOT NULL REFERENCES department(department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  full_name         TEXT NOT NULL,
  position          TEXT NOT NULL,
  experience_years  INT  DEFAULT 0 CHECK (experience_years >= 0),
  phone             TEXT NOT NULL UNIQUE,
  salary            NUMERIC(12,2) NOT NULL CHECK (salary > 0),
  email             TEXT UNIQUE,
  password_hash     TEXT,
  role              TEXT NOT NULL CHECK (role IN ('ADMIN','HEAD','EMP'))
);

CREATE INDEX IF NOT EXISTS idx_employee_department ON employee(department_id);

-- =========================================
-- 3) OperationType
-- =========================================
CREATE TABLE IF NOT EXISTS operation_type (
  operation_type_id BIGSERIAL PRIMARY KEY,
  name              TEXT NOT NULL UNIQUE,
  category          TEXT
);

-- =========================================
-- 4) Operation
-- =========================================
CREATE TABLE IF NOT EXISTS operation (
  operation_id      BIGSERIAL PRIMARY KEY,
  employee_id       BIGINT NOT NULL REFERENCES employee(employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  operation_type_id BIGINT NOT NULL REFERENCES operation_type(operation_type_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  start_time        TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time          TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'DONE'
                   CHECK (status IN ('DONE','CANCELED','IN_PROGRESS')),
  CHECK (end_time IS NULL OR end_time >= start_time)
);

CREATE INDEX IF NOT EXISTS idx_operation_employee_time ON operation(employee_id, start_time);
CREATE INDEX IF NOT EXISTS idx_operation_type_time ON operation(operation_type_id, start_time);

-- =========================================
-- 5) SLARegulation
-- =========================================
CREATE TABLE IF NOT EXISTS sla_regulation (
  sla_id            BIGSERIAL PRIMARY KEY,
  operation_type_id BIGINT NOT NULL REFERENCES operation_type(operation_type_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  norm_seconds      INT NOT NULL CHECK (norm_seconds >= 0),
  threshold_seconds INT DEFAULT 0 CHECK (threshold_seconds >= 0),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(operation_type_id)
);

-- =========================================
-- 6) KPITemplate
-- =========================================
CREATE TABLE IF NOT EXISTS kpi_template (
  kpi_template_id BIGSERIAL PRIMARY KEY,
  name            TEXT NOT NULL UNIQUE,
  formula         TEXT NOT NULL,
  unit            TEXT
);

-- =========================================
-- 7) KPIResult
-- =========================================
CREATE TABLE IF NOT EXISTS kpi_result (
  kpi_result_id    BIGSERIAL PRIMARY KEY,
  employee_id      BIGINT NOT NULL REFERENCES employee(employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  kpi_template_id  BIGINT NOT NULL REFERENCES kpi_template(kpi_template_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  period_date      DATE NOT NULL,
  value            NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (value >= 0),
  UNIQUE(employee_id, kpi_template_id, period_date)
);

CREATE INDEX IF NOT EXISTS idx_kpi_result_period ON kpi_result(period_date);
CREATE INDEX IF NOT EXISTS idx_kpi_result_employee_period ON kpi_result(employee_id, period_date);

-- =========================================
-- 8) Task
-- =========================================
CREATE TABLE IF NOT EXISTS task (
  task_id      BIGSERIAL PRIMARY KEY,
  assignee_id  BIGINT NOT NULL REFERENCES employee(employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  creator_id   BIGINT NOT NULL REFERENCES employee(employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  title        TEXT NOT NULL,
  description  TEXT,
  due_date     DATE,
  status       TEXT NOT NULL DEFAULT 'ASSIGNED'
              CHECK (status IN ('ASSIGNED','IN_PROGRESS','DONE','CANCELED')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_assignee_status ON task(assignee_id, status);

-- =========================================
-- 9) WorkSchedule
-- =========================================
CREATE TABLE IF NOT EXISTS work_schedule (
  schedule_id  BIGSERIAL PRIMARY KEY,
  employee_id  BIGINT NOT NULL REFERENCES employee(employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  work_date    DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME,
  CHECK (end_time IS NULL OR end_time >= start_time),
  UNIQUE(employee_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_work_schedule_date ON work_schedule(work_date);

-- =========================================
-- 10) AuditLog
-- =========================================
CREATE TABLE IF NOT EXISTS audit_log (
  audit_id     BIGSERIAL PRIMARY KEY,
  employee_id  BIGINT REFERENCES employee(employee_id) ON UPDATE CASCADE ON DELETE SET NULL,
  action       TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip           TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log(created_at);

-- =========================================
-- Seed: KPI Templates (MVP)
-- =========================================
INSERT INTO kpi_template (name, formula, unit) VALUES
  ('Количество операций',           'OPS_COUNT',            'шт'),
  ('Средняя длительность',          'AVG_DURATION_SEC',     'сек'),
  ('Нарушения SLA',                 'SLA_VIOLATIONS_COUNT', 'шт'),
  ('Рабочие часы',                  'TOTAL_WORK_HOURS',     'ч')
ON CONFLICT (name) DO NOTHING;
