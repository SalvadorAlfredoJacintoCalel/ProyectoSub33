-- Fix schema: agregar columnas faltantes a cat_rangos y roles
-- Ejecutar en PostgreSQL

-- 1. Agregar columnas a cat_rangos
ALTER TABLE cat_rangos ADD COLUMN IF NOT EXISTS descripcion VARCHAR(255);
ALTER TABLE cat_rangos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE cat_rangos ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 2. Agregar columnas a roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 3. Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cat_rangos' ORDER BY ordinal_position;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'roles' ORDER BY ordinal_position;
