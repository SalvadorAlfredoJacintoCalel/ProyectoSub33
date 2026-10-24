-- ============================================================================
-- Migración: cambio de contraseña obligatorio en la primera sesión
--   - usuarios.debe_cambiar_contrasena (la clave temporal se debe cambiar)
-- Idempotente. Aplicar con psql (NO `dotnet ef database update`).
-- ============================================================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS debe_cambiar_contrasena BOOLEAN NOT NULL DEFAULT FALSE;
