-- Clave de icono (dibujo) por recompensa.
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS icon_key text;
