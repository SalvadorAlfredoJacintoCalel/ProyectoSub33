-- ============================================================================
-- Migración: seguridad de autenticación
--   - usuarios.email (recuperación por correo)
--   - usuarios.intentos_fallidos / bloqueado_hasta (bloqueo por fuerza bruta)
--   - codigos_recuperacion.email_destino + codigo_otp_hash (OTP hasheado)
-- Idempotente. NO ejecutar `dotnet ef database update`; aplicar con psql.
-- ============================================================================

-- 1) usuarios: correo + bloqueo por intentos fallidos
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS intentos_fallidos INT NOT NULL DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ NULL;

-- 2) codigos_recuperacion: soporte de email + almacenamiento hasheado del OTP
ALTER TABLE codigos_recuperacion ADD COLUMN IF NOT EXISTS email_destino VARCHAR(255) NULL;
ALTER TABLE codigos_recuperacion ADD COLUMN IF NOT EXISTS codigo_otp_hash VARCHAR(64) NULL;

-- El destino de recuperación puede ser correo (ya no depende solo del teléfono)
ALTER TABLE codigos_recuperacion ALTER COLUMN telefono_destino DROP NOT NULL;
