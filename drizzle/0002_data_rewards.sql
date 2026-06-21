-- Ajustes por defecto: unidad (€) y nombre/icono de los puntos (editable en la app).
INSERT INTO settings (key, value) VALUES
  ('unit', 'eur'),
  ('points_name', 'gemas'),
  ('points_icon', '💎')
ON CONFLICT (key) DO NOTHING;

-- Recompensas de ejemplo (editables/borrables). Coste en céntimos (=/100):
-- en € son euros, en puntos son puntos. Solo si la tabla está vacía.
INSERT INTO rewards (name, icon, cost_cents, sort_order)
SELECT v.name, v.icon, v.cost_cents, v.sort_order
FROM (VALUES
  ('30 min de pantalla extra', '🎮', 500, 1),
  ('Un helado',                '🍦', 300, 2),
  ('Acostarse 30 min más tarde','🌙', 400, 3),
  ('Elegir la peli del finde', '🎬', 800, 4)
) AS v(name, icon, cost_cents, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM rewards);
