-- Dibujo fijado a mano (slug de public/icons/<edad>/): si es NULL, el icono
-- se asigna automáticamente (clave del catálogo → nombre → emoji).
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS icon_slug text;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS icon_slug text;
