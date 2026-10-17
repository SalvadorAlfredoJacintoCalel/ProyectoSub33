-- ============================================================================
-- Sistema de permisos de módulos por rol (Opción A)
-- Crea cat_modulos, rol_modulo y siembra los 8 módulos + asignación al admin.
-- ============================================================================

-- 1. Tabla cat_modulos
CREATE TABLE IF NOT EXISTS cat_modulos (
    modulo_id   SERIAL PRIMARY KEY,
    codigo      VARCHAR(50)  NOT NULL UNIQUE,
    nombre      VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- 2. Tabla rol_modulo (relación muchos-a-muchos rol <-> módulo)
CREATE TABLE IF NOT EXISTS rol_modulo (
    rol_id    INT NOT NULL REFERENCES roles(rol_id) ON DELETE CASCADE,
    modulo_id INT NOT NULL REFERENCES cat_modulos(modulo_id) ON DELETE CASCADE,
    CONSTRAINT pk_rol_modulo PRIMARY KEY (rol_id, modulo_id)
);

-- 3. Seed: 8 módulos básicos
INSERT INTO cat_modulos (codigo, nombre, descripcion) VALUES
    ('analytics',   'Dashboard',   'Panel de control y analíticas'),
    ('emergencias', 'Emergencias', 'Control y seguimiento de incidentes'),
    ('inventario',  'Inventario',  'Gestión de insumos, equipos y movimientos'),
    ('finanzas',    'Finanzas',    'Gestión de ingresos, gastos y donaciones'),
    ('donaciones',  'Donaciones',  'Gestión de donaciones recibidas'),
    ('vehiculos',   'Vehículos',   'Estado de flota y combustible'),
    ('reportes',    'Reportes',    'Reportes y estadísticas del sistema'),
    ('personal',    'Personal',    'Gestión del personal de la compañía')
ON CONFLICT (codigo) DO NOTHING;

-- 4. Asignar todos los módulos al rol admin
INSERT INTO rol_modulo (rol_id, modulo_id)
SELECT r.rol_id, m.modulo_id
FROM roles r
CROSS JOIN cat_modulos m
WHERE LOWER(r.nombre) IN ('admin', 'administrador')
ON CONFLICT DO NOTHING;

SELECT 'Módulos sembrados correctamente (admin tiene todos).' AS resultado;
