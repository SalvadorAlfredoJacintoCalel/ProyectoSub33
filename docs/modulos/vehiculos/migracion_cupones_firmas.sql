-- ==============================================================
-- Migración: firmas del reporte oficial de cupones
-- Formato oficial "Libro Mensual de Cupones de Combustible"
-- Idempotente: se puede ejecutar varias veces.
-- ==============================================================

-- 1. Firmas de los 4 cargos del pie en el período
ALTER TABLE vehiculo_cupones_periodos
    ADD COLUMN IF NOT EXISTS elaborado_por VARCHAR(150),
    ADD COLUMN IF NOT EXISTS jefe_abastecimientos VARCHAR(150),
    ADD COLUMN IF NOT EXISTS jefe_33_cia VARCHAR(150),
    ADD COLUMN IF NOT EXISTS director VARCHAR(150),
    ADD COLUMN IF NOT EXISTS firma_elaborado_por_base64 TEXT,
    ADD COLUMN IF NOT EXISTS firma_jefe_abastecimientos_base64 TEXT,
    ADD COLUMN IF NOT EXISTS firma_jefe_33_cia_base64 TEXT,
    ADD COLUMN IF NOT EXISTS firma_director_base64 TEXT;

-- 2. Firma del responsable de cada cupón (migración pendiente desde docs/modulos/vehiculos)
ALTER TABLE vehiculo_cupones
    ADD COLUMN IF NOT EXISTS firma_base64 TEXT;

-- 3. Índice de ordenamiento por fecha + comisión
CREATE INDEX IF NOT EXISTS ix_cupones_periodo_fecha_comision
    ON vehiculo_cupones(periodo_id, fecha, comision_no, registro_id);

-- Verificación
SELECT periodo_id, anio, mes, elaborado_por, jefe_abastecimientos, jefe_33_cia, director
FROM vehiculo_cupones_periodos
ORDER BY periodo_id;
