-- ==============================================================
-- Migración: quitar firmas base64 del período de cupones
-- Se eliminan las 4 firmas del pie del reporte oficial
-- (se conservan los 4 nombres en texto: elaborado_por,
--  jefe_abastecimientos, jefe_33_cia, director).
-- Idempotente: se puede ejecutar varias veces.
-- ==============================================================

ALTER TABLE vehiculo_cupones_periodos
  DROP COLUMN IF EXISTS firma_elaborado_por_base64,
  DROP COLUMN IF EXISTS firma_jefe_abastecimientos_base64,
  DROP COLUMN IF EXISTS firma_jefe_33_cia_base64,
  DROP COLUMN IF EXISTS firma_director_base64;

-- Verificación
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vehiculo_cupones_periodos'
  AND column_name LIKE 'firma_%'
ORDER BY column_name;
