-- ==============================================================
-- Migración: comisión realizada en el período de cupones
-- Columna para la fila "SE RESIBIERON CUPONES - COMISIÓN REALIZADA"
-- del reporte oficial "Libro Mensual de Cupones de Combustible".
-- Idempotente: se puede ejecutar varias veces.
-- ==============================================================

ALTER TABLE vehiculo_cupones_periodos
    ADD COLUMN IF NOT EXISTS comision_realizada INT;

-- Verificación
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vehiculo_cupones_periodos'
  AND column_name = 'comision_realizada';
