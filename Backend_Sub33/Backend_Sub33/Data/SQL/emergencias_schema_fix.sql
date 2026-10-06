-- ============================================================================
-- Fix emergencias_servicios: agregar columnas denormalizadas que el código
-- (DTOs / EmergenciaService) espera pero que faltan en la BD real.
-- Idempotente: seguro ejecutar múltiples veces.
-- ============================================================================

ALTER TABLE emergencias_servicios
    ADD COLUMN IF NOT EXISTS hospital_destino_nombre VARCHAR(150) NULL;

ALTER TABLE emergencias_servicios
    ADD COLUMN IF NOT EXISTS estado_entrega VARCHAR(100) NULL;

ALTER TABLE emergencias_servicios
    ADD COLUMN IF NOT EXISTS unidad_asignada_nombre VARCHAR(150) NULL;
