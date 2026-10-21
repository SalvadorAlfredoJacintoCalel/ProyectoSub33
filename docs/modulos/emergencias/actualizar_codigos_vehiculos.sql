WITH activos AS (
  SELECT vehiculo_id, ROW_NUMBER() OVER (ORDER BY vehiculo_id) AS rn
  FROM vehiculos WHERE estado = 'Activo'
)
UPDATE vehiculos v
SET no_unidad = CASE a.rn WHEN 1 THEN '96' WHEN 2 THEN '240' WHEN 3 THEN '1419' WHEN 4 THEN 'Acuática' END,
    codigo = CASE a.rn WHEN 1 THEN '96' WHEN 2 THEN '240' WHEN 3 THEN '1419' WHEN 4 THEN 'Acuática' END,
    updated_at = CURRENT_TIMESTAMP
FROM activos a
WHERE v.vehiculo_id = a.vehiculo_id AND a.rn <= 4;

SELECT vehiculo_id, no_unidad, codigo, estado FROM vehiculos WHERE estado = 'Activo' ORDER BY vehiculo_id;
