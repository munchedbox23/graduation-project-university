-- =========================================
-- 005: Данные за сегодняшний день для графиков
-- Запускать ПОСЛЕ 001, 002, 003, 004
-- =========================================

-- =========================================
-- Операции за сегодня (разные типы, разные сотрудники)
-- =========================================
INSERT INTO operation (employee_id, operation_type_id, start_time, end_time, status)
SELECT
  e.employee_id,
  ot.operation_type_id,
  NOW() - (op_offset || ' minutes')::interval,
  NOW() - (op_offset || ' minutes')::interval + (duration || ' seconds')::interval,
  'DONE'
FROM (
  VALUES
    -- (email, op_name, minutes_ago, duration_sec)
    ('emp1@bank.ru', 'Приём платежа',          480, 180),
    ('emp1@bank.ru', 'Выдача наличных',         460, 420),
    ('emp1@bank.ru', 'Открытие счёта',          440, 720),
    ('emp1@bank.ru', 'Перевод между счетами',   420, 240),
    ('emp1@bank.ru', 'Приём наличных',          380, 300),
    ('emp2@bank.ru', 'Приём платежа',           470, 150),
    ('emp2@bank.ru', 'Закрытие счёта',          450, 900),
    ('emp2@bank.ru', 'Конвертация валюты',      430, 360),
    ('emp2@bank.ru', 'Оформление вклада',       410, 480),
    ('emp3@bank.ru', 'Оформление кредита',      460, 1800),
    ('emp3@bank.ru', 'Досрочное погашение',     440, 1200),
    ('emp3@bank.ru', 'Приём платежа',           400, 200),
    ('emp4@bank.ru', 'Оформление кредита',      450, 2400),
    ('emp4@bank.ru', 'Открытие счёта',          430, 600),
    ('emp4@bank.ru', 'Выдача наличных',         390, 350),
    ('emp5@bank.ru', 'Оформление кредита',      440, 3000),
    ('emp5@bank.ru', 'Досрочное погашение',     420, 1500),
    ('emp6@bank.ru', 'Конвертация валюты',      460, 400),
    ('emp6@bank.ru', 'Оформление вклада',       440, 550),
    ('emp6@bank.ru', 'Перевод между счетами',   420, 280)
) AS v(email, op_name, op_offset, duration)
JOIN employee e ON e.email = v.email
JOIN operation_type ot ON ot.name = v.op_name;

-- =========================================
-- Операции в работе (IN_PROGRESS) — сейчас
-- =========================================
INSERT INTO operation (employee_id, operation_type_id, start_time, end_time, status)
SELECT
  e.employee_id,
  ot.operation_type_id,
  NOW() - (op_offset || ' minutes')::interval,
  NULL,
  'IN_PROGRESS'
FROM (
  VALUES
    ('emp1@bank.ru', 'Приём платежа',        5),
    ('emp3@bank.ru', 'Оформление кредита',   12),
    ('emp5@bank.ru', 'Конвертация валюты',    8)
) AS v(email, op_name, op_offset)
JOIN employee e ON e.email = v.email
JOIN operation_type ot ON ot.name = v.op_name;

-- =========================================
-- Графики работы на сегодня
-- =========================================
INSERT INTO work_schedule (employee_id, work_date, start_time, end_time, shift_type)
SELECT
  e.employee_id,
  CURRENT_DATE,
  '09:00'::time,
  '18:00'::time,
  'WORK'
FROM employee e
WHERE e.email IN ('emp1@bank.ru','emp2@bank.ru','emp3@bank.ru','emp4@bank.ru','emp5@bank.ru','emp6@bank.ru')
ON CONFLICT (employee_id, work_date) DO UPDATE
  SET start_time = EXCLUDED.start_time,
      end_time   = EXCLUDED.end_time,
      shift_type = EXCLUDED.shift_type;

-- Один на удалёнке
UPDATE work_schedule
SET shift_type = 'REMOTE', start_time = '10:00'::time, end_time = '19:00'::time
WHERE employee_id = (SELECT employee_id FROM employee WHERE email = 'emp6@bank.ru')
  AND work_date = CURRENT_DATE;

-- =========================================
-- KPI за сегодня
-- =========================================
INSERT INTO kpi_result (employee_id, kpi_template_id, period_date, value)
SELECT
  e.employee_id,
  kt.kpi_template_id,
  CURRENT_DATE,
  v.val
FROM (
  VALUES
    ('emp1@bank.ru', 'Кол-во операций за день',    5.0),
    ('emp1@bank.ru', 'Среднее время операции (мин)', 6.5),
    ('emp1@bank.ru', 'Процент нарушений SLA (%)',   0.0),
    ('emp2@bank.ru', 'Кол-во операций за день',    4.0),
    ('emp2@bank.ru', 'Среднее время операции (мин)', 7.2),
    ('emp2@bank.ru', 'Процент нарушений SLA (%)',   25.0),
    ('emp3@bank.ru', 'Кол-во операций за день',    3.0),
    ('emp3@bank.ru', 'Среднее время операции (мин)', 25.0),
    ('emp3@bank.ru', 'Процент нарушений SLA (%)',   33.3),
    ('emp4@bank.ru', 'Кол-во операций за день',    3.0),
    ('emp4@bank.ru', 'Среднее время операции (мин)', 18.8),
    ('emp4@bank.ru', 'Процент нарушений SLA (%)',   33.3),
    ('emp5@bank.ru', 'Кол-во операций за день',    2.0),
    ('emp5@bank.ru', 'Среднее время операции (мин)', 37.5),
    ('emp5@bank.ru', 'Процент нарушений SLA (%)',   50.0),
    ('emp6@bank.ru', 'Кол-во операций за день',    3.0),
    ('emp6@bank.ru', 'Среднее время операции (мин)', 5.5),
    ('emp6@bank.ru', 'Процент нарушений SLA (%)',   0.0)
) AS v(email, kpi_name, val)
JOIN employee e ON e.email = v.email
JOIN kpi_template kt ON kt.name = v.kpi_name
ON CONFLICT DO NOTHING;

-- =========================================
-- Аудит за сегодня
-- =========================================
INSERT INTO audit_log (employee_id, action, ip, created_at)
SELECT e.employee_id, v.action, v.ip, NOW() - (v.mins || ' minutes')::interval
FROM (
  VALUES
    ('emp1@bank.ru', 'LOGIN',            '192.168.1.10', 490),
    ('emp2@bank.ru', 'LOGIN',            '192.168.1.11', 475),
    ('emp3@bank.ru', 'LOGIN',            '192.168.1.12', 465),
    ('emp4@bank.ru', 'LOGIN',            '192.168.1.13', 455),
    ('emp5@bank.ru', 'LOGIN',            '192.168.1.14', 445),
    ('emp6@bank.ru', 'LOGIN',            '10.0.0.5',     460),
    ('admin@bank.ru','LOGIN',            '192.168.1.1',  500),
    ('admin@bank.ru','CREATE_OPERATION', '192.168.1.1',  400),
    ('head@bank.ru', 'LOGIN',            '192.168.1.2',  350)
) AS v(email, action, ip, mins)
JOIN employee e ON e.email = v.email;
