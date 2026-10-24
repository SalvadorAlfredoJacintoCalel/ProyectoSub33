-- ============================================================================
-- Migración: bloqueo permanente de cuenta (desbloqueo manual por admin)
--   - usuarios.bloqueada (bloqueo permanente por intentos fallidos)
--   - elimina columnas obsoletas: bloqueado_hasta (temporal) y codigo_otp
-- Idempotente. Aplicar con psql (NO `dotnet ef database update`).
-- ============================================================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueada BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE usuarios DROP COLUMN IF EXISTS bloqueado_hasta;

ALTER TABLE codigos_recuperacion DROP COLUMN IF EXISTS codigo_otp;
