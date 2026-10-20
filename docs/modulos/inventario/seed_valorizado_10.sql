-- ==========================================
-- SEED DEMO: 10 items para la vista VALORIZADO
-- Base de datos: Sub_33 (PostgreSQL)
-- Re-ejecutable: borra y reinserta los items SEED-VAL-*
-- ==========================================

BEGIN;

-- 1. Columnas requeridas (idempotente; por si no se corrió migracion_valorizado.sql)
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS valor_unitario NUMERIC(12,2);
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS estado VARCHAR(10) NOT NULL DEFAULT 'Activo';
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS fecha_baja DATE;
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS ubicacion VARCHAR(120);
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS es_central BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE inventario_items ALTER COLUMN stock_minimo SET DEFAULT 0;
ALTER TABLE inventario_items ALTER COLUMN unidad_medida DROP NOT NULL;
ALTER TABLE inventario_items DROP CONSTRAINT IF EXISTS inventario_items_codigo_barras_key;
DROP INDEX IF EXISTS inventario_items_codigo_barras_key;

-- 2. Categorias del inventario valorizado
INSERT INTO cat_categorias_inventario (nombre, descripcion) VALUES
('Mobiliario y Equipo de Oficina', 'Mobiliario y equipo de oficina'),
('Equipo Diverso', 'Equipo diverso de la subestacion'),
('Mobiliario y Equipo de Alojamiento', 'Mobiliario y equipo de alojamiento'),
('Carretones', 'Carretones'),
('Embarcaciones', 'Embarcaciones y equipo acuatico'),
('Vehículos', 'Vehículos de la subestacion')
ON CONFLICT (nombre) DO NOTHING;

-- 3. Limpiar seed previo
DELETE FROM inventario_movimientos WHERE item_id IN (SELECT item_id FROM inventario_items WHERE codigo_barras LIKE 'SEED-VAL-%');
DELETE FROM equipo_unidades WHERE item_id IN (SELECT item_id FROM inventario_items WHERE codigo_barras LIKE 'SEED-VAL-%');
DELETE FROM inventario_items WHERE codigo_barras LIKE 'SEED-VAL-%';

-- 4. 10 items de prueba
INSERT INTO inventario_items
    (categoria_inv_id, codigo_barras, nombre, stock_actual, stock_minimo, unidad_medida,
     valor_unitario, estado, ubicacion, es_central, origen, created_at)
VALUES
    ((SELECT categoria_inv_id FROM cat_categorias_inventario WHERE nombre = 'Mobiliario y Equipo de Oficina'),
     'SEED-VAL-01', 'Escritorio de metal y formica', 1, 0, 'unidad', 200.00, 'Activo', 'sala de estar', false, 'Donado', CURRENT_TIMESTAMP),
    ((SELECT categoria_inv_id FROM cat_categorias_inventario WHERE nombre = 'Mobiliario y Equipo de Oficina'),
     'SEED-VAL-02', 'Silla secretarial y asiento graduable', 1, 0, 'unidad', 366.07, 'Activo', 'sala de estar', true, 'Compra Propia', CURRENT_TIMESTAMP),
    ((SELECT categoria_inv_id FROM cat_categorias_inventario WHERE nombre = 'Mobiliario y Equipo de Oficina'),
     'SEED-VAL-03', 'Equipo de computo CPU/Monitor', 1, 0, 'unidad', 7990.00, 'Activo', 'sala de estar', false, 'Compra Propia', CURRENT_TIMESTAMP),
    ((SELECT categoria_inv_id FROM cat_categorias_inventario WHERE nombre = 'Equipo Diverso'),
     'SEED-VAL-04', 'Microondas marca Oster', 1, 0, 'unidad', 800.00, 'Activo', 'cocina', false, 'Compra Propia', CURRENT_TIMESTAMP),
    ((SELECT categoria_inv_id FROM cat_categorias_inventario WHERE nombre = 'Equipo Diverso'),
     'SEED-VAL-05', 'Refrigerador marca Samsung', 1, 0, 'unidad', 800.00, 'Activo', 'cocina', false, 'Compra Propia', CURRENT_TIMESTAMP),
    ((SELECT categoria_inv_id FROM cat_categorias_inventario WHERE nombre = 'Equipo Diverso'),
     'SEED-VAL-06', 'Literas color negro', 5, 0, 'unidad', 150.00, 'Activo', 'dormitorio', false, 'Compra Propia', CURRENT_TIMESTAMP),
    ((SELECT categoria_inv_id FROM cat_categorias_inventario WHERE nombre = 'Mobiliario y Equipo de Alojamiento'),
     'SEED-VAL-07', 'Camilla telescopica', 1, 0, 'unidad', 500.00, 'Activo', 'sala de maquina', false, 'Donado', CURRENT_TIMESTAMP),
    ((SELECT categoria_inv_id FROM cat_categorias_inventario WHERE nombre = 'Mobiliario y Equipo de Alojamiento'),
     'SEED-VAL-08', 'Bomba de agua', 1, 0, 'unidad', 6000.00, 'Activo', 'terreno', true, 'Compra Propia', CURRENT_TIMESTAMP),
    ((SELECT categoria_inv_id FROM cat_categorias_inventario WHERE nombre = 'Embarcaciones'),
     'SEED-VAL-09', 'Lancha de 16 pies', 1, 0, 'unidad', 15000.00, 'Activo', 'sala de maquina', false, 'Compra Propia', CURRENT_TIMESTAMP),
    ((SELECT categoria_inv_id FROM cat_categorias_inventario WHERE nombre = 'Vehículos'),
     'SEED-VAL-10', 'Vehiculo tipo pick up marca Mazda modelo 1999', 1, 0, 'unidad', 69154.60, 'Activo', 'sala de maquina', true, 'Compra Propia', CURRENT_TIMESTAMP);

COMMIT;

-- 5. Verificacion (debe devolver 10 filas y el total)
SELECT codigo_barras,
       nombre,
       stock_actual AS cantidad,
       valor_unitario,
       (stock_actual * COALESCE(valor_unitario, 0))::numeric(12,2) AS total,
       estado,
       origen,
       es_central,
       ubicacion
FROM inventario_items
WHERE codigo_barras LIKE 'SEED-VAL-%'
ORDER BY codigo_barras;

SELECT COALESCE(SUM(stock_actual * COALESCE(valor_unitario, 0)), 0)::numeric(12,2) AS total_general
FROM inventario_items
WHERE codigo_barras LIKE 'SEED-VAL-%';
