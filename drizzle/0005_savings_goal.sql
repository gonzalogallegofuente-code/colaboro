-- Meta de ahorro por hijo (opcional).
ALTER TABLE kids ADD COLUMN IF NOT EXISTS goal_name      text;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS goal_icon      text;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS goal_cost_cents integer;
