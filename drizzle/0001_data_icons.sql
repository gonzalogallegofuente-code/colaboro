-- Rellena iconos/avatares en las filas ya sembradas (las nuevas ya vienen con
-- icono desde seed.sql). Idempotente: se puede ejecutar varias veces.
UPDATE kids SET emoji='🦁' WHERE name='Leo'   AND emoji IN ('🙂','');
UPDATE kids SET emoji='🦊' WHERE name='Eliot' AND emoji IN ('🙂','');

UPDATE tasks SET icon='🧹' WHERE name='Aspirador casa'      AND icon IN ('⭐','');
UPDATE tasks SET icon='🚽' WHERE name='Cuarto de baño'      AND icon IN ('⭐','');
UPDATE tasks SET icon='🚪' WHERE name='Aspirar entrada'     AND icon IN ('⭐','');
UPDATE tasks SET icon='🪟' WHERE name='Cristales'           AND icon IN ('⭐','');
UPDATE tasks SET icon='👕' WHERE name='Tender la ropa'      AND icon IN ('⭐','');
UPDATE tasks SET icon='🪶' WHERE name='Limpiar el polvo'    AND icon IN ('⭐','');
UPDATE tasks SET icon='🍳' WHERE name='Hacer la comida'     AND icon IN ('⭐','');
UPDATE tasks SET icon='🧺' WHERE name='Recoger ropa tendal' AND icon IN ('⭐','');
UPDATE tasks SET icon='🍽️' WHERE name='Recoger lavaplatos'  AND icon IN ('⭐','');
UPDATE tasks SET icon='🗑️' WHERE name='Tirar la basura'     AND icon IN ('⭐','');
