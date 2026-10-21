ALTER TABLE emergencias_servicios
  ADD COLUMN IF NOT EXISTS vehiculo_id INT NULL
  REFERENCES vehiculos(vehiculo_id);

UPDATE emergencias_servicios es
SET vehiculo_id = v.vehiculo_id
FROM cat_unidades cu
JOIN vehiculos v ON v.placa = cu.placa
WHERE es.unidad_asignada_id = cu.unidad_id
  AND es.vehiculo_id IS NULL
  AND cu.placa IS NOT NULL;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'emergencias_servicios'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%(estado)%'
  LOOP
    EXECUTE format('ALTER TABLE emergencias_servicios DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

UPDATE emergencias_servicios
SET estado = 'En proceso'
WHERE estado = 'Activo';

ALTER TABLE emergencias_servicios
  ALTER COLUMN estado SET DEFAULT 'En proceso';

ALTER TABLE emergencias_servicios
  ADD CONSTRAINT emergencias_servicios_estado_check
  CHECK (estado IN ('En proceso', 'Terminado', 'Inactivo'));

CREATE INDEX IF NOT EXISTS ix_emergencias_vehiculo_estado
  ON emergencias_servicios(vehiculo_id, estado);
