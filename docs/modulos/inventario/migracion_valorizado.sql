-- ==========================================
-- MIGRACIÓN INVENTARIO VALORIZADO
-- Ejecutar en PostgreSQL (Base de datos: Sub_33)
-- ==========================================

-- 1. Nuevas columnas en inventario_items
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS valor_unitario NUMERIC(12,2);
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS estado VARCHAR(10) NOT NULL DEFAULT 'Activo';
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS fecha_baja DATE;
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS ubicacion VARCHAR(120);
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS es_central BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE inventario_items ALTER COLUMN stock_minimo SET DEFAULT 0;
ALTER TABLE inventario_items ALTER COLUMN unidad_medida DROP NOT NULL;

-- 2. Permitir código duplicado / vacío (la hoja de inventario repite y omite códigos)
ALTER TABLE inventario_items DROP CONSTRAINT IF EXISTS inventario_items_codigo_barras_key;
DROP INDEX IF EXISTS inventario_items_codigo_barras_key;

-- 3. Categorías del inventario valorizado (hoja Sub 33)
INSERT INTO cat_categorias_inventario (nombre, descripcion) VALUES
('Mobiliario y Equipo de Oficina', 'Mobiliario y equipo de oficina'),
('Equipo Diverso', 'Equipo diverso de la subestación'),
('Mobiliario y Equipo de Alojamiento', 'Mobiliario y equipo de alojamiento'),
('Carretones', 'Carretones'),
('Embarcaciones', 'Embarcaciones y equipo acuático'),
('Vehículos', 'Vehículos de la subestación')
ON CONFLICT (nombre) DO NOTHING;

-- 4. Verificación
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'inventario_items'
  AND column_name IN ('valor_unitario','estado','fecha_baja','ubicacion','es_central')
ORDER BY ordinal_position;
