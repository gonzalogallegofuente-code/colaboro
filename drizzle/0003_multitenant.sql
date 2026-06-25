-- Migración a multiusuario. Atómica (BEGIN/COMMIT). Convierte la instalación
-- de una sola familia en una cuenta, y da a CADA hijo su propia copia de las
-- tareas y recompensas, preservando las marcas (completions) ya existentes.
-- Sustituir __EMAIL__ y __HASH__ antes de ejecutar.
BEGIN;

-- 1) Tabla de cuentas
CREATE TABLE IF NOT EXISTS accounts (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Columnas nuevas (nullable de momento) + temporales legacy_id
ALTER TABLE kids     ADD COLUMN IF NOT EXISTS account_id integer REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE tasks    ADD COLUMN IF NOT EXISTS account_id integer REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE tasks    ADD COLUMN IF NOT EXISTS kid_id     integer REFERENCES kids(id)     ON DELETE CASCADE;
ALTER TABLE tasks    ADD COLUMN IF NOT EXISTS legacy_id  integer;
ALTER TABLE rewards  ADD COLUMN IF NOT EXISTS account_id integer REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE rewards  ADD COLUMN IF NOT EXISTS kid_id     integer REFERENCES kids(id)     ON DELETE CASCADE;
ALTER TABLE rewards  ADD COLUMN IF NOT EXISTS legacy_id  integer;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS account_id integer REFERENCES accounts(id) ON DELETE CASCADE;

-- 3) Crear la cuenta de la familia existente
INSERT INTO accounts (email, password_hash) VALUES ('__EMAIL__', '__HASH__');

-- 4) Asignar hijos y ajustes a la cuenta
UPDATE kids     SET account_id = (SELECT id FROM accounts WHERE email='__EMAIL__');
UPDATE settings SET account_id = (SELECT id FROM accounts WHERE email='__EMAIL__');

-- 5) Tareas: copiar cada tarea compartida para CADA hijo (legacy_id = id original)
INSERT INTO tasks (account_id, kid_id, name, description, icon, value_cents, weekly_target, color, sort_order, active, legacy_id)
SELECT (SELECT id FROM accounts WHERE email='__EMAIL__'), k.id,
       t.name, t.description, t.icon, t.value_cents, t.weekly_target, t.color, t.sort_order, t.active, t.id
FROM tasks t CROSS JOIN kids k
WHERE t.kid_id IS NULL;
-- Reapuntar cada marca a la copia de SU hijo
UPDATE completions c SET task_id = nt.id
FROM tasks nt WHERE nt.legacy_id = c.task_id AND nt.kid_id = c.kid_id;
-- Borrar las tareas compartidas antiguas (ya nadie las referencia)
DELETE FROM tasks WHERE kid_id IS NULL;

-- 6) Recompensas: igual
INSERT INTO rewards (account_id, kid_id, name, icon, cost_cents, sort_order, active, legacy_id)
SELECT (SELECT id FROM accounts WHERE email='__EMAIL__'), k.id,
       r.name, r.icon, r.cost_cents, r.sort_order, r.active, r.id
FROM rewards r CROSS JOIN kids k
WHERE r.kid_id IS NULL;
UPDATE redemptions rd SET reward_id = nr.id
FROM rewards nr WHERE nr.legacy_id = rd.reward_id AND nr.kid_id = rd.kid_id;
DELETE FROM rewards WHERE kid_id IS NULL;

-- 7) Ajustes: clave primaria compuesta (account_id, key)
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE settings ADD PRIMARY KEY (account_id, key);

-- 8) Poner NOT NULL ahora que está todo relleno
ALTER TABLE kids    ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE tasks   ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE tasks   ALTER COLUMN kid_id     SET NOT NULL;
ALTER TABLE rewards ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE rewards ALTER COLUMN kid_id     SET NOT NULL;

-- 9) Quitar las columnas temporales
ALTER TABLE tasks   DROP COLUMN legacy_id;
ALTER TABLE rewards DROP COLUMN legacy_id;

COMMIT;
