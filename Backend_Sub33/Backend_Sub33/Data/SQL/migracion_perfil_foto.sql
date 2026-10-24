-- ============================================================================
-- Migración: foto de perfil (base64)
--   - usuarios.foto_base64 (avatar del bombero)
-- Idempotente. Aplicar con psql (NO `dotnet ef database update`).
-- ============================================================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_base64 TEXT NULL;
