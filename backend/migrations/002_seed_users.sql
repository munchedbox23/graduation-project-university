-- =========================================
-- Тестовые данные: отдел + 3 сотрудника
-- =========================================

-- Отдел
INSERT INTO department (name, phone) VALUES
  ('Операционный отдел', '+74951234567')
ON CONFLICT DO NOTHING;

-- Администратор (пароль: admin123)
INSERT INTO employee (department_id, full_name, position, phone, salary, email, password_hash, role)
SELECT
  d.department_id,
  'Иванов Иван Иванович',
  'Системный администратор',
  '+70000000001',
  120000.00,
  'admin@bank.ru',
  '$2a$10$RUFFP0YIVYRFBSCt.jt/5O79rh4M41mkqX2s5RSxJ/cbD13c4r4hK',
  'ADMIN'
FROM department d WHERE d.phone = '+74951234567'
ON CONFLICT (email) DO NOTHING;

-- Руководитель (пароль: head123)
INSERT INTO employee (department_id, full_name, position, phone, salary, email, password_hash, role)
SELECT
  d.department_id,
  'Петрова Анна Сергеевна',
  'Руководитель операционного офиса',
  '+70000000002',
  95000.00,
  'head@bank.ru',
  '$2a$10$fI/iredgkVi6aJEFOTc9GOSHaDWjipjJEszB7lszu52j5vknvZ0Iu',
  'HEAD'
FROM department d WHERE d.phone = '+74951234567'
ON CONFLICT (email) DO NOTHING;

-- Сотрудник (пароль: emp123)
INSERT INTO employee (department_id, full_name, position, phone, salary, email, password_hash, role)
SELECT
  d.department_id,
  'Сидоров Алексей Петрович',
  'Операционист',
  '+70000000003',
  55000.00,
  'emp@bank.ru',
  '$2a$10$EcJIjiwUSF.m1QPpmZXh2Ovj4W2S.pmhtjMIC4DJx4OZbt5F.e3HC',
  'EMP'
FROM department d WHERE d.phone = '+74951234567'
ON CONFLICT (email) DO NOTHING;
