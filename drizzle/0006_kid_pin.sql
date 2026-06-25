-- PIN opcional (4 dígitos) por hijo, para el modo niño.
ALTER TABLE kids ADD COLUMN IF NOT EXISTS pin text;
