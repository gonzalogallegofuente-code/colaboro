-- Canje con aprobación: lo que canjea el NIÑO queda 'pending' hasta el visto
-- bueno del padre (aprobar → 'approved'; rechazar → se borra y libera saldo).
-- El saldo descuenta también los pendientes (retención). Las filas históricas
-- quedan aprobadas.
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';
