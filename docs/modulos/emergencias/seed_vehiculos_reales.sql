INSERT INTO cat_tipos_vehiculo (nombre)
SELECT t.nombre
FROM (VALUES
  ('Autobomba'),
  ('Ambulancia'),
  ('Rescate'),
  ('Acuática')
) AS t(nombre)
WHERE NOT EXISTS (
  SELECT 1 FROM cat_tipos_vehiculo c
  WHERE c.nombre = t.nombre
);

UPDATE vehiculos
SET estado = 'Inactivo',
    updated_at = CURRENT_TIMESTAMP
WHERE estado = 'Activo'
  AND COALESCE(no_unidad, '') NOT IN ('96', '240', '1419', 'Acuática')
  AND COALESCE(codigo, '') NOT IN ('96', '240', '1419', 'Acuática');

WITH tipos AS (
  SELECT
    MAX(CASE WHEN nombre = 'Autobomba' THEN tipo_vehiculo_id END) AS autobomba,
    MAX(CASE WHEN nombre = 'Ambulancia' THEN tipo_vehiculo_id END) AS ambulancia,
    MAX(CASE WHEN nombre = 'Rescate' THEN tipo_vehiculo_id END) AS rescate,
    MAX(CASE WHEN nombre = 'Acuática' THEN tipo_vehiculo_id END) AS acuatica
  FROM cat_tipos_vehiculo
),
unidades(codigo, tipo_id) AS (
  VALUES
    ('96', (SELECT autobomba FROM tipos)),
    ('240', (SELECT ambulancia FROM tipos)),
    ('1419', (SELECT rescate FROM tipos)),
    ('Acuática', (SELECT acuatica FROM tipos))
)
INSERT INTO vehiculos (
  codigo, tipo_id, marca, modelo, anio, color, placa,
  no_unidad, combustible, kilometraje, estado_operativo, origen,
  estado, valor_unitario, ubicacion, created_at, updated_at
)
SELECT
  v.codigo, v.tipo_id, 'Por definir', 'Por definir', NULL, NULL, NULL,
  v.codigo, NULL, 0, 'Operativa', 'Compra Propia',
  'Activo', 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM unidades v
WHERE NOT EXISTS (
  SELECT 1 FROM vehiculos x
  WHERE x.codigo = v.codigo OR x.no_unidad = v.codigo
);

WITH tipos AS (
  SELECT
    MAX(CASE WHEN nombre = 'Autobomba' THEN tipo_vehiculo_id END) AS autobomba,
    MAX(CASE WHEN nombre = 'Ambulancia' THEN tipo_vehiculo_id END) AS ambulancia,
    MAX(CASE WHEN nombre = 'Rescate' THEN tipo_vehiculo_id END) AS rescate,
    MAX(CASE WHEN nombre = 'Acuática' THEN tipo_vehiculo_id END) AS acuatica
  FROM cat_tipos_vehiculo
),
unidades(codigo, tipo_id) AS (
  VALUES
    ('96', (SELECT autobomba FROM tipos)),
    ('240', (SELECT ambulancia FROM tipos)),
    ('1419', (SELECT rescate FROM tipos)),
    ('Acuática', (SELECT acuatica FROM tipos))
)
UPDATE vehiculos v
SET estado = 'Activo',
    estado_operativo = 'Operativa',
    no_unidad = COALESCE(v.no_unidad, u.codigo),
    tipo_id = COALESCE(v.tipo_id, u.tipo_id),
    updated_at = CURRENT_TIMESTAMP
FROM unidades u
WHERE v.codigo = u.codigo OR v.no_unidad = u.codigo;

SELECT no_unidad, codigo, estado_operativo, estado
FROM vehiculos
WHERE estado = 'Activo'
ORDER BY no_unidad;
