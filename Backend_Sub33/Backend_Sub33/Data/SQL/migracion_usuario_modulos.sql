-- ============================================================================
-- Permisos de módulos por USUARIO
-- Crea usuario_modulos y siembra el módulo "seguridad" (Configuración).
-- Idempotente.
-- ============================================================================

-- 1. Tabla usuario_modulos (muchos-a-muchos usuario <-> módulo)
CREATE TABLE IF NOT EXISTS usuario_modulos (
    usuario_id UUID NOT NULL REFERENCES usuarios(usuario_id) ON DELETE CASCADE,
    modulo_id  INT  NOT NULL REFERENCES cat_modulos(modulo_id) ON DELETE CASCADE,
    CONSTRAINT pk_usuario_modulos PRIMARY KEY (usuario_id, modulo_id)
);

-- 2. Agregar módulo "seguridad" (Configuración) al catálogo de módulos
--    ("bienvenida"/Inicio se maneja como siempre visible en el frontend, no se guarda)
INSERT INTO cat_modulos (codigo, nombre, descripcion) VALUES
    ('seguridad', 'Configuración', 'Usuarios, roles, permisos y parámetros del sistema')
ON CONFLICT (codigo) DO NOTHING;

-- 3. Asegurar que el rol admin herede todos los módulos (incluido seguridad)
INSERT INTO rol_modulo (rol_id, modulo_id)
SELECT r.rol_id, m.modulo_id
FROM roles r
CROSS JOIN cat_modulos m
WHERE LOWER(r.nombre) IN ('admin', 'administrador')
ON CONFLICT DO NOTHING;

SELECT 'usuario_modulos creado y módulo seguridad sembrado.' AS resultado;
