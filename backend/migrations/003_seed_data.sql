-- =========================================
-- 003: Тестовые данные для всех таблиц
-- Предполагается что 001 и 002 уже применены
-- =========================================

-- =========================================
-- Дополнительные отделы
-- =========================================
INSERT INTO department (name, phone) VALUES
  ('Кредитный отдел',         '+74951234568'),
  ('Отдел по работе с ВИП',   '+74951234569'),
  ('Бэк-офис',                '+74951234570')
ON CONFLICT DO NOTHING;

-- =========================================
-- Дополнительные сотрудники (пароль: emp123)
-- hash: $2a$10$EcJIjiwUSF.m1QPpmZXh2Ovj4W2S.pmhtjMIC4DJx4OZbt5F.e3HC
-- =========================================
INSERT INTO employee (department_id, full_name, position, phone, salary, experience_years, email, password_hash, role)
SELECT d.department_id, v.full_name, v.position, v.phone, v.salary, v.exp, v.email, '$2a$10$EcJIjiwUSF.m1QPpmZXh2Ovj4W2S.pmhtjMIC4DJx4OZbt5F.e3HC', v.role
FROM (VALUES
  ('Операционный отдел', 'Козлова Мария Андреевна',    'Операционист',            '+70000000004', 52000, 2, 'emp2@bank.ru', 'EMP'),
  ('Операционный отдел', 'Новиков Дмитрий Сергеевич',  'Старший операционист',    '+70000000005', 68000, 5, 'emp3@bank.ru', 'EMP'),
  ('Кредитный отдел',    'Лебедева Ольга Николаевна',  'Кредитный специалист',    '+70000000006', 72000, 4, 'emp4@bank.ru', 'EMP'),
  ('Кредитный отдел',    'Морозов Игорь Валентинович', 'Менеджер по кредитам',    '+70000000007', 75000, 6, 'emp5@bank.ru', 'EMP'),
  ('Отдел по работе с ВИП', 'Захарова Светлана Ивановна', 'ВИП-менеджер',         '+70000000008', 90000, 8, 'emp6@bank.ru', 'EMP')
) AS v(dept_name, full_name, position, phone, salary, exp, email, role)
JOIN department d ON d.name = v.dept_name
ON CONFLICT (email) DO NOTHING;

-- =========================================
-- Типы операций
-- =========================================
INSERT INTO operation_type (name, category) VALUES
  ('Открытие счёта',            'Расчётно-кассовое обслуживание'),
  ('Закрытие счёта',            'Расчётно-кассовое обслуживание'),
  ('Приём платежа',             'Расчётно-кассовое обслуживание'),
  ('Выдача наличных',           'Кассовые операции'),
  ('Приём наличных',            'Кассовые операции'),
  ('Оформление кредита',        'Кредитование'),
  ('Досрочное погашение',       'Кредитование'),
  ('Конвертация валюты',        'Валютные операции'),
  ('Перевод между счетами',     'Расчётно-кассовое обслуживание'),
  ('Оформление вклада',         'Депозитные операции')
ON CONFLICT (name) DO NOTHING;

-- =========================================
-- SLA регламенты
-- =========================================
INSERT INTO sla_regulation (operation_type_id, norm_seconds, threshold_seconds, is_active)
SELECT ot.operation_type_id,
       CASE ot.name
         WHEN 'Открытие счёта'        THEN 600
         WHEN 'Закрытие счёта'        THEN 300
         WHEN 'Приём платежа'         THEN 180
         WHEN 'Выдача наличных'       THEN 120
         WHEN 'Приём наличных'        THEN 120
         WHEN 'Оформление кредита'    THEN 1800
         WHEN 'Досрочное погашение'   THEN 600
         WHEN 'Конвертация валюты'    THEN 300
         WHEN 'Перевод между счетами' THEN 180
         WHEN 'Оформление вклада'     THEN 600
       END AS norm_seconds,
       60 AS threshold_seconds,
       TRUE
FROM operation_type ot
WHERE ot.name IN (
  'Открытие счёта','Закрытие счёта','Приём платежа','Выдача наличных',
  'Приём наличных','Оформление кредита','Досрочное погашение',
  'Конвертация валюты','Перевод между счетами','Оформление вклада'
)
ON CONFLICT (operation_type_id) DO NOTHING;

-- =========================================
-- Операции за последние 7 дней
-- =========================================
INSERT INTO operation (employee_id, operation_type_id, start_time, end_time, status)
SELECT
  e.employee_id,
  ot.operation_type_id,
  ts AS start_time,
  ts + (dur || ' seconds')::interval AS end_time,
  'DONE'
FROM
  (VALUES
    -- emp1 (id=3)
    (3, 'Приём платежа',         NOW() - INTERVAL '6 days' + INTERVAL '9 hours',   150),
    (3, 'Выдача наличных',       NOW() - INTERVAL '6 days' + INTERVAL '10 hours',  100),
    (3, 'Перевод между счетами', NOW() - INTERVAL '6 days' + INTERVAL '11 hours',  200),
    (3, 'Открытие счёта',        NOW() - INTERVAL '5 days' + INTERVAL '9 hours',   580),
    (3, 'Приём платежа',         NOW() - INTERVAL '5 days' + INTERVAL '10 hours',  160),
    (3, 'Приём наличных',        NOW() - INTERVAL '5 days' + INTERVAL '14 hours',  130),
    (3, 'Конвертация валюты',    NOW() - INTERVAL '4 days' + INTERVAL '9 hours',   280),
    (3, 'Приём платежа',         NOW() - INTERVAL '4 days' + INTERVAL '11 hours',  175),
    (3, 'Выдача наличных',       NOW() - INTERVAL '3 days' + INTERVAL '10 hours',  115),
    (3, 'Закрытие счёта',        NOW() - INTERVAL '3 days' + INTERVAL '13 hours',  320),
    (3, 'Оформление вклада',     NOW() - INTERVAL '2 days' + INTERVAL '9 hours',   620),
    (3, 'Приём платежа',         NOW() - INTERVAL '2 days' + INTERVAL '11 hours',  145),
    (3, 'Перевод между счетами', NOW() - INTERVAL '1 day'  + INTERVAL '10 hours',  195),
    (3, 'Приём наличных',        NOW() - INTERVAL '1 day'  + INTERVAL '14 hours',  110),
    (3, 'Приём платежа',         NOW()                     - INTERVAL '2 hours',   165),
    -- emp2 (id=4, козлова)
    (4, 'Выдача наличных',       NOW() - INTERVAL '6 days' + INTERVAL '9 hours',   105),
    (4, 'Приём платежа',         NOW() - INTERVAL '6 days' + INTERVAL '11 hours',  170),
    (4, 'Открытие счёта',        NOW() - INTERVAL '5 days' + INTERVAL '10 hours',  650),
    (4, 'Конвертация валюты',    NOW() - INTERVAL '4 days' + INTERVAL '9 hours',   295),
    (4, 'Приём наличных',        NOW() - INTERVAL '4 days' + INTERVAL '13 hours',  125),
    (4, 'Оформление вклада',     NOW() - INTERVAL '3 days' + INTERVAL '9 hours',   590),
    (4, 'Приём платежа',         NOW() - INTERVAL '2 days' + INTERVAL '10 hours',  180),
    (4, 'Перевод между счетами', NOW() - INTERVAL '1 day'  + INTERVAL '11 hours',  210),
    (4, 'Приём платежа',         NOW()                     - INTERVAL '3 hours',   155),
    -- emp3 (id=5, новиков) — нарушает SLA иногда
    (5, 'Оформление кредита',    NOW() - INTERVAL '6 days' + INTERVAL '9 hours',   1950),
    (5, 'Приём платежа',         NOW() - INTERVAL '5 days' + INTERVAL '10 hours',  190),
    (5, 'Досрочное погашение',   NOW() - INTERVAL '5 days' + INTERVAL '13 hours',  720),
    (5, 'Оформление кредита',    NOW() - INTERVAL '4 days' + INTERVAL '9 hours',   1920),
    (5, 'Приём платежа',         NOW() - INTERVAL '3 days' + INTERVAL '11 hours',  185),
    (5, 'Выдача наличных',       NOW() - INTERVAL '2 days' + INTERVAL '14 hours',  130),
    (5, 'Оформление кредита',    NOW() - INTERVAL '1 day'  + INTERVAL '9 hours',   1850),
    (5, 'Приём платежа',         NOW()                     - INTERVAL '1 hour',    175)
  ) AS v(emp_id, op_name, ts, dur)
JOIN employee e ON e.employee_id = v.emp_id
JOIN operation_type ot ON ot.name = v.op_name
ON CONFLICT DO NOTHING;

-- =========================================
-- Задачи
-- =========================================
INSERT INTO task (assignee_id, creator_id, title, description, due_date, status)
SELECT
  a.employee_id,
  c.employee_id,
  v.title,
  v.description,
  v.due_date::date,
  v.status
FROM (VALUES
  (3, 2, 'Пройти обучение по новым стандартам',  'Изучить обновлённые регламенты по работе с клиентами', (NOW() + INTERVAL '3 days')::text,  'ASSIGNED'),
  (3, 2, 'Сдать отчёт за февраль',              'Подготовить сводный отчёт по операциям',               (NOW() + INTERVAL '1 day')::text,   'IN_PROGRESS'),
  (4, 2, 'Провести инструктаж новых сотрудников','Ознакомить с рабочими процессами',                     (NOW() + INTERVAL '5 days')::text,  'ASSIGNED'),
  (5, 1, 'Обновить шаблоны кредитных договоров', 'Внести изменения согласно новым правилам ЦБ',          (NOW() + INTERVAL '7 days')::text,  'ASSIGNED'),
  (5, 2, 'Проверить документы по кредитам',      'Сверить документацию по закрытым кредитам',            (NOW() - INTERVAL '2 days')::text,  'DONE'),
  (6, 2, 'Формирование отчёта по клиентам',      'Сводный отчёт по ВИП-клиентам за квартал',             (NOW() + INTERVAL '4 days')::text,  'ASSIGNED'),
  (3, 1, 'Тестирование нового ПО',               'Протестировать обновлённую систему учёта',              (NOW() + INTERVAL '2 days')::text,  'IN_PROGRESS'),
  (4, 1, 'Инвентаризация кассы',                 'Провести плановую инвентаризацию',                     (NOW() + INTERVAL '1 day')::text,   'ASSIGNED')
) AS v(assignee_id, creator_id, title, description, due_date, status)
JOIN employee a ON a.employee_id = v.assignee_id
JOIN employee c ON c.employee_id = v.creator_id
ON CONFLICT DO NOTHING;

-- =========================================
-- Графики работы (текущая + прошлая неделя)
-- =========================================
INSERT INTO work_schedule (employee_id, work_date, start_time, end_time)
SELECT
  e.employee_id,
  (NOW()::date - (day_offset || ' days')::interval)::date AS work_date,
  '09:00'::time AS start_time,
  '18:00'::time AS end_time
FROM
  employee e,
  (VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9)) AS d(day_offset)
WHERE
  e.role = 'EMP'
  AND EXTRACT(DOW FROM (NOW()::date - (d.day_offset || ' days')::interval)) NOT IN (0, 6)
ON CONFLICT (employee_id, work_date) DO NOTHING;

-- =========================================
-- KPI результаты за последние 7 дней
-- =========================================
INSERT INTO kpi_result (employee_id, kpi_template_id, period_date, value)
SELECT
  o.employee_id,
  kt.kpi_template_id,
  DATE(o.start_time) AS period_date,
  COUNT(*)::numeric   AS value
FROM operation o, kpi_template kt
WHERE kt.formula = 'OPS_COUNT'
  AND o.status = 'DONE'
GROUP BY o.employee_id, kt.kpi_template_id, DATE(o.start_time)
ON CONFLICT (employee_id, kpi_template_id, period_date) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO kpi_result (employee_id, kpi_template_id, period_date, value)
SELECT
  o.employee_id,
  kt.kpi_template_id,
  DATE(o.start_time) AS period_date,
  COALESCE(AVG(EXTRACT(EPOCH FROM (o.end_time - o.start_time))), 0)::numeric AS value
FROM operation o, kpi_template kt
WHERE kt.formula = 'AVG_DURATION_SEC'
  AND o.end_time IS NOT NULL AND o.status = 'DONE'
GROUP BY o.employee_id, kt.kpi_template_id, DATE(o.start_time)
ON CONFLICT (employee_id, kpi_template_id, period_date) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO kpi_result (employee_id, kpi_template_id, period_date, value)
SELECT
  o.employee_id,
  kt.kpi_template_id,
  DATE(o.start_time) AS period_date,
  COUNT(*)::numeric   AS value
FROM operation o
JOIN kpi_template kt ON kt.formula = 'SLA_VIOLATIONS_COUNT'
JOIN sla_regulation sla ON sla.operation_type_id = o.operation_type_id AND sla.is_active = TRUE
WHERE o.end_time IS NOT NULL AND o.status = 'DONE'
  AND EXTRACT(EPOCH FROM (o.end_time - o.start_time)) > (sla.norm_seconds + COALESCE(sla.threshold_seconds, 0))
GROUP BY o.employee_id, kt.kpi_template_id, DATE(o.start_time)
ON CONFLICT (employee_id, kpi_template_id, period_date) DO UPDATE SET value = EXCLUDED.value;

-- =========================================
-- Аудит
-- =========================================
INSERT INTO audit_log (employee_id, action, ip, created_at) VALUES
  (1, 'LOGIN',             '192.168.1.1',  NOW() - INTERVAL '6 days'),
  (2, 'LOGIN',             '192.168.1.2',  NOW() - INTERVAL '6 days'),
  (3, 'LOGIN',             '192.168.1.10', NOW() - INTERVAL '6 days'),
  (1, 'CREATE_EMPLOYEE',   '192.168.1.1',  NOW() - INTERVAL '5 days'),
  (2, 'RECALCULATE_KPI',   '192.168.1.2',  NOW() - INTERVAL '4 days'),
  (1, 'CREATE_SLA',        '192.168.1.1',  NOW() - INTERVAL '3 days'),
  (3, 'LOGIN',             '192.168.1.10', NOW() - INTERVAL '2 days'),
  (1, 'IMPORT_OPERATIONS', '192.168.1.1',  NOW() - INTERVAL '1 day'),
  (2, 'LOGIN',             '192.168.1.2',  NOW() - INTERVAL '12 hours'),
  (1, 'LOGIN',             '192.168.1.1',  NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;
