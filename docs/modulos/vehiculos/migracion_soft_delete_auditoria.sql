-- Migración: Soft Delete + Auditoría para vehiculo_cupones
-- Fecha: 2026-10-23 (corregida: personal_id es UUID, no INT)

-- 1. Columnas de soft delete y auditoría en vehiculo_cupones
ALTER TABLE vehiculo_cupones
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS eliminado_por_id UUID NULL,
  ADD COLUMN IF NOT EXISTS eliminado_por_nombre VARCHAR(200) NULL,
  ADD COLUMN IF NOT EXISTS creado_por_id UUID NULL,
  ADD COLUMN IF NOT EXISTS creado_por_nombre VARCHAR(200) NULL,
  ADD COLUMN IF NOT EXISTS modificado_por_id UUID NULL,
  ADD COLUMN IF NOT EXISTS modificado_por_nombre VARCHAR(200) NULL,
  ADD COLUMN IF NOT EXISTS modificado_en TIMESTAMPTZ NULL;

-- 2. Índice para filtrar activos rápidamente
CREATE INDEX IF NOT EXISTS idx_vehiculo_cupones_activo ON vehiculo_cupones(activo);

-- 3. Actualizar registros existentes (marcar como activos)
UPDATE vehiculo_cupones SET activo = TRUE WHERE activo IS NULL;
