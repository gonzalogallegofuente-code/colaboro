-- Estilo de iconos por hijo + clave de icono por tarea.
ALTER TABLE kids  ADD COLUMN IF NOT EXISTS icon_style text NOT NULL DEFAULT 'emoji';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS icon_key   text;

-- Rellenar la clave del catálogo a partir del emoji de las tareas por defecto,
-- para que los estilos línea/relleno se vean bien desde el primer momento.
UPDATE tasks SET icon_key='broom'       WHERE icon_key IS NULL AND icon='🧹';
UPDATE tasks SET icon_key='toilet'      WHERE icon_key IS NULL AND icon='🚽';
UPDATE tasks SET icon_key='door'        WHERE icon_key IS NULL AND icon='🚪';
UPDATE tasks SET icon_key='sparkle'     WHERE icon_key IS NULL AND icon='🪟';
UPDATE tasks SET icon_key='t-shirt'     WHERE icon_key IS NULL AND icon='👕';
UPDATE tasks SET icon_key='feather'     WHERE icon_key IS NULL AND icon='🪶';
UPDATE tasks SET icon_key='cooking-pot' WHERE icon_key IS NULL AND icon='🍳';
UPDATE tasks SET icon_key='basket'      WHERE icon_key IS NULL AND icon='🧺';
UPDATE tasks SET icon_key='fork-knife'  WHERE icon_key IS NULL AND icon='🍽️';
UPDATE tasks SET icon_key='trash'       WHERE icon_key IS NULL AND icon='🗑️';
