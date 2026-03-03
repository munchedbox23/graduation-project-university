-- Добавляем тип смены в рабочий график
ALTER TABLE work_schedule
  ADD COLUMN IF NOT EXISTS shift_type TEXT NOT NULL DEFAULT 'WORK'
  CHECK (shift_type IN ('WORK','VACATION','SICK','DAYOFF','REMOTE'));

-- Обновляем существующие записи
UPDATE work_schedule SET shift_type = 'WORK' WHERE shift_type IS NULL;
