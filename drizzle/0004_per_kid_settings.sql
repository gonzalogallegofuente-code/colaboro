-- Ajustes (tema, unidad, nombre/icono de puntos) ahora POR HIJO.
-- Cada hijo hereda lo que tuviera su cuenta.
BEGIN;

ALTER TABLE kids ADD COLUMN IF NOT EXISTS theme       text NOT NULL DEFAULT 'infantil';
ALTER TABLE kids ADD COLUMN IF NOT EXISTS unit        text NOT NULL DEFAULT 'eur';
ALTER TABLE kids ADD COLUMN IF NOT EXISTS points_name text NOT NULL DEFAULT 'gemas';
ALTER TABLE kids ADD COLUMN IF NOT EXISTS points_icon text NOT NULL DEFAULT '💎';

UPDATE kids k SET
  theme       = coalesce((SELECT value FROM settings s WHERE s.account_id = k.account_id AND s.key = 'theme'), 'infantil'),
  unit        = coalesce((SELECT value FROM settings s WHERE s.account_id = k.account_id AND s.key = 'unit'), 'eur'),
  points_name = coalesce((SELECT value FROM settings s WHERE s.account_id = k.account_id AND s.key = 'points_name'), 'gemas'),
  points_icon = coalesce((SELECT value FROM settings s WHERE s.account_id = k.account_id AND s.key = 'points_icon'), '💎');

COMMIT;
