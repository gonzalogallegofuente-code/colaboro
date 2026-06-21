-- Datos iniciales: hijos y las 10 tareas de la hoja. Idempotente: solo
-- inserta si las tablas están vacías, así se puede ejecutar sin miedo.

INSERT INTO kids (name, color, sort_order)
SELECT v.name, v.color, v.sort_order
FROM (VALUES
  ('Leo',   '#2563eb', 0),
  ('Eliot', '#e11d48', 1)
) AS v(name, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM kids);

INSERT INTO tasks (name, description, value_cents, weekly_target, color, sort_order)
SELECT v.name, v.description, v.value_cents, v.weekly_target, v.color, v.sort_order
FROM (VALUES
  ('Aspirador casa',      'cocina + habitaciones + salón + pasillo',              100, 7, '#f7d0e0', 1),
  ('Cuarto de baño',      'aspirar, lavabo, váter, bañera, espejo, fregar suelo', 100, 2, '#cfe0f5', 2),
  ('Aspirar entrada',     'aspirar alfombra y suelo, limpiar polvo',              100, 7, '#dde7dd', 3),
  ('Cristales',           'limpiar polvo, despacho + salón + habitaciones',       100, 2, '#f2ecc9', 4),
  ('Tender la ropa',      'ropa estirada y bien colocada',                        100, 7, '#ddd6f0', 5),
  ('Limpiar el polvo',    'de toda la casa, sacudir plumero cada poco tiempo',    100, 7, '#f3d4e1', 6),
  ('Hacer la comida',     '',                                                     100, 7, '#d2d8f0', 7),
  ('Recoger ropa tendal', 'dejar ropa organizada',                                100, 7, '#d6e1d6', 8),
  ('Recoger lavaplatos',  'sacar y colocar',                                      100, 7, '#e3e3c5', 9),
  ('Tirar la basura',     'orgánico, plásticos, papel y vidrio',                   50, 7, '#c5cfe2', 10)
) AS v(name, description, value_cents, weekly_target, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM tasks);
