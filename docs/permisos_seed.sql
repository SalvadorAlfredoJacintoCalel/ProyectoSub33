-- ==============================================================
-- PERMISOS GRANULARES POR MÓDULO
-- Proyecto: Sistema 33ª Compañía de Bomberos
-- Idempotente: se puede ejecutar varias veces sin duplicar.
--
-- IMPORTANTE: este proyecto mantiene el esquema 100% por scripts SQL
-- (la tabla __EFMigrationsHistory está vacía a propósito). NO ejecutar
-- "dotnet ef database update": intentaría recrear todas las tablas.
--
-- Orden: 1) DDL  2) catálogo de permisos  3) asignación a roles
--         4) ajuste de módulos por rol
-- ==============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. DDL
-- ──────────────────────────────────────────────────────────────

-- 1.1 Columna "nombre" en permisos (etiqueta legible para la UI)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'permisos' AND column_name = 'nombre'
    ) THEN
        ALTER TABLE permisos ADD COLUMN nombre VARCHAR(100) NOT NULL DEFAULT '';
    END IF;
END $$;

-- 1.2 Tabla de overrides por usuario
CREATE TABLE IF NOT EXISTS usuario_permisos (
    usuario_id UUID NOT NULL REFERENCES usuarios(usuario_id) ON DELETE CASCADE,
    permiso_id INT  NOT NULL REFERENCES permisos(permiso_id)  ON DELETE CASCADE,
    CONSTRAINT pk_usuario_permisos PRIMARY KEY (usuario_id, permiso_id)
);

-- 1.3 Módulo "seguridad" (por si no existe)
INSERT INTO cat_modulos (codigo, nombre, descripcion)
VALUES ('seguridad', 'Configuración', 'Usuarios, roles, permisos y parámetros del sistema')
ON CONFLICT (codigo) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 2. CATÁLOGO DE PERMISOS
-- ──────────────────────────────────────────────────────────────

-- PERSONAL
INSERT INTO permisos (modulo_id, codigo, nombre, descripcion) VALUES
((SELECT modulo_id FROM cat_modulos WHERE codigo='personal'), 'personal.crear',            'Crear miembro',          'Registrar nuevos miembros de la compañía'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='personal'), 'personal.editar',           'Editar miembro',         'Actualizar la información de un miembro'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='personal'), 'personal.cambiar-estado',   'Cambiar estado miembro', 'Activar o desactivar a un miembro'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='personal'), 'personal.acceso-sistema',   'Gestionar acceso al sistema', 'Administrar el usuario, la contraseña y el rol de un miembro'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='personal'), 'personal.eliminar',          'Eliminar miembro',       'Dar de baja a un miembro de la compañía')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, modulo_id = EXCLUDED.modulo_id;

-- INVENTARIO
INSERT INTO permisos (modulo_id, codigo, nombre, descripcion) VALUES
((SELECT modulo_id FROM cat_modulos WHERE codigo='inventario'), 'inventario.ver',                   'Ver inventario',          'Consultar items, kardex, ubicaciones e indicadores'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='inventario'), 'inventario.registrar-uso-servicio','Registrar uso en servicio','Registrar el consumo de insumos durante un servicio'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='inventario'), 'inventario.crear',                 'Crear item',              'Registrar nuevos insumos y equipos en el inventario'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='inventario'), 'inventario.editar',                'Editar item',             'Actualizar la información de un item'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='inventario'), 'inventario.baja',                  'Dar de baja item',        'Dar de baja un item indicando responsable y fecha'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='inventario'), 'inventario.eliminar',              'Eliminar item',           'Eliminar definitivamente un item del inventario'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='inventario'), 'inventario.ajuste',                'Ajuste de inventario',    'Registrar ajustes de stock por entrada, salida o corrección'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='inventario'), 'inventario.equipo-asignar',        'Asignar equipo a unidades','Definir el equipo disponible de cada unidad')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, modulo_id = EXCLUDED.modulo_id;

-- VEHÍCULOS
INSERT INTO permisos (modulo_id, codigo, nombre, descripcion) VALUES
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.ver',                        'Ver flota',                 'Consultar la flota, los indicadores y el detalle de cada unidad'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.registrar-cupones',         'Registrar cupones',         'Registrar los cupones de combustible recibidos'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.crear',                      'Crear vehículo',            'Registrar un vehículo en la flota'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.editar',                     'Editar vehículo',           'Actualizar la información de un vehículo'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.cambiar-estado',             'Cambiar estado vehículo',   'Activar o desactivar un vehículo de la flota'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.estado-operativo',           'Cambiar estado operativo',  'Pasar el vehículo entre Operativa, Mantenimiento, En Servicio o Fuera de Servicio'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.eliminar',                   'Eliminar vehículo',         'Dar de baja un vehículo de la flota'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.mantenimientos.crear',       'Registrar mantenimiento',   'Registrar el ingreso, avance y cierre de una hoja de mantenimiento'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.mantenimientos.editar',      'Editar mantenimiento',      'Actualizar una hoja de mantenimiento'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.mantenimientos.eliminar',    'Eliminar mantenimiento',    'Eliminar una hoja de mantenimiento'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.mantenimientos.imprimir',   'Imprimir hoja mantenimiento','Generar la hoja de control de mantenimiento'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.cupones.crear',              'Crear cupón',               'Registrar un cupón de combustible'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.cupones.editar',             'Editar cupón',              'Actualizar un cupón de combustible'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.cupones.eliminar',           'Eliminar cupón',            'Eliminar un cupón de combustible'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.cupones.periodos',           'Gestionar periodos',        'Configurar los periodos mensuales del libro de cupones'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.cupones.ver',                'Ver cupones',               'Consultar el libro de cupones y el reporte oficial'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='vehiculos'), 'vehiculos.cupones.imprimir',           'Imprimir reporte oficial',  'Generar e imprimir el reporte oficial del libro de cupones')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, modulo_id = EXCLUDED.modulo_id;

-- DONACIONES
INSERT INTO permisos (modulo_id, codigo, nombre, descripcion) VALUES
((SELECT modulo_id FROM cat_modulos WHERE codigo='donaciones'), 'donaciones.ver',             'Ver donaciones',            'Consultar las donaciones registradas y el libro mensual'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='donaciones'), 'donaciones.registrar',       'Registrar donación',        'Registrar una donación en efectivo o en especie'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='donaciones'), 'donaciones.editar',           'Editar donación',           'Actualizar los datos de una donación registrada'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='donaciones'), 'donaciones.cambiar-estado',  'Cambiar estado donación',   'Actualizar el estado de una donación registrada'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='donaciones'), 'donaciones.eliminar',         'Eliminar donación',         'Eliminar una donación registrada'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='donaciones'), 'donaciones.libro.crear',     'Crear movimiento libro',    'Registrar un movimiento en el libro mensual'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='donaciones'), 'donaciones.libro.editar',    'Editar movimiento libro',   'Actualizar un movimiento del libro mensual'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='donaciones'), 'donaciones.libro.eliminar',  'Eliminar movimiento libro', 'Eliminar un movimiento del libro mensual')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, modulo_id = EXCLUDED.modulo_id;

-- EMERGENCIAS
INSERT INTO permisos (modulo_id, codigo, nombre, descripcion) VALUES
((SELECT modulo_id FROM cat_modulos WHERE codigo='emergencias'), 'emergencias.ver',             'Ver emergencias',        'Consultar el listado y el detalle de los servicios'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='emergencias'), 'emergencias.crear',           'Crear emergencia',      'Registrar un servicio de emergencia'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='emergencias'), 'emergencias.editar',          'Editar emergencia',     'Actualizar los datos de un servicio registrado'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='emergencias'), 'emergencias.cambiar-estado', 'Cambiar estado emergencia','Mover el servicio de En proceso a Terminado o Inactivo')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, modulo_id = EXCLUDED.modulo_id;

-- SEGURIDAD / CONFIGURACIÓN
INSERT INTO permisos (modulo_id, codigo, nombre, descripcion) VALUES
((SELECT modulo_id FROM cat_modulos WHERE codigo='seguridad'), 'seguridad.parametros', 'Gestionar parámetros', 'Editar los parámetros generales del sistema'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='seguridad'), 'seguridad.catalogos',  'Gestionar catálogos',  'Administrar las listas maestras: rangos, roles, tipos, hospitales y más'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='seguridad'), 'seguridad.usuarios',  'Gestionar usuarios',   'Administrar los usuarios del sistema'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='seguridad'), 'seguridad.permisos',  'Gestionar permisos',   'Definir los permisos de cada rol y usuario'),
((SELECT modulo_id FROM cat_modulos WHERE codigo='seguridad'), 'seguridad.roles',     'Gestionar roles',      'Administrar los roles del sistema')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, modulo_id = EXCLUDED.modulo_id;

-- ──────────────────────────────────────────────────────────────
-- 3. ASIGNACIÓN A ROLES
--    (los nombres de rol reales son Administrador/Secretario/Voluntario)
-- ──────────────────────────────────────────────────────────────

DELETE FROM rol_permisos;

-- ADMIN: todos los permisos
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.rol_id, p.permiso_id
FROM roles r, permisos p
WHERE LOWER(r.nombre) IN ('admin', 'administrador');

-- SECRETARIO: operativos (sin seguridad, sin personal.*, sin anti-fraude de donaciones)
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.rol_id, p.permiso_id
FROM roles r, permisos p
WHERE LOWER(r.nombre) = 'secretario'
  AND p.codigo IN (
    'inventario.ver','inventario.registrar-uso-servicio','inventario.crear','inventario.editar',
    'inventario.baja','inventario.ajuste','inventario.equipo-asignar',
    'vehiculos.ver','vehiculos.registrar-cupones','vehiculos.crear','vehiculos.editar',
    'vehiculos.cambiar-estado','vehiculos.estado-operativo',
    'vehiculos.mantenimientos.crear','vehiculos.mantenimientos.editar','vehiculos.mantenimientos.eliminar','vehiculos.mantenimientos.imprimir',
    'vehiculos.cupones.crear','vehiculos.cupones.editar','vehiculos.cupones.eliminar','vehiculos.cupones.periodos',
    'vehiculos.cupones.ver','vehiculos.cupones.imprimir',
    'donaciones.ver','donaciones.registrar','donaciones.libro.crear','donaciones.libro.editar','donaciones.libro.eliminar',
    'emergencias.ver','emergencias.crear','emergencias.editar','emergencias.cambiar-estado'
  );

-- VOLUNTARIO: básicos + ownership en emergencias + cupones (ver, crear, imprimir)
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.rol_id, p.permiso_id
FROM roles r, permisos p
WHERE LOWER(r.nombre) = 'voluntario'
  AND p.codigo IN (
    'inventario.ver','inventario.registrar-uso-servicio',
    'vehiculos.ver','vehiculos.registrar-cupones',
    'vehiculos.cupones.ver','vehiculos.cupones.crear','vehiculos.cupones.imprimir',
    'emergencias.ver','emergencias.crear','emergencias.editar','emergencias.cambiar-estado'
  );

-- ──────────────────────────────────────────────────────────────
-- 4. MÓDULOS POR ROL (visibilidad del menú)
--    Admin: todo · Secretario: +personal · Voluntario: sin personal/donaciones/seguridad
-- ──────────────────────────────────────────────────────────────

-- 4.1 Admin: todos los módulos
INSERT INTO rol_modulo (rol_id, modulo_id)
SELECT r.rol_id, m.modulo_id
FROM roles r, cat_modulos m
WHERE LOWER(r.nombre) IN ('admin', 'administrador')
ON CONFLICT DO NOTHING;

-- 4.2 Secretario: todo menos seguridad
DELETE FROM rol_modulo rm
USING roles r, cat_modulos m
WHERE rm.rol_id = r.rol_id AND rm.modulo_id = m.modulo_id
  AND LOWER(r.nombre) = 'secretario' AND m.codigo = 'seguridad';

INSERT INTO rol_modulo (rol_id, modulo_id)
SELECT r.rol_id, m.modulo_id
FROM roles r, cat_modulos m
WHERE LOWER(r.nombre) = 'secretario' AND m.codigo IN
  ('analytics','emergencias','inventario','finanzas','donaciones','vehiculos','reportes','personal')
ON CONFLICT DO NOTHING;

-- 4.3 Voluntario: analitica, emergencias, inventario, finanzas, vehiculos, reportes
DELETE FROM rol_modulo rm
USING roles r, cat_modulos m
WHERE rm.rol_id = r.rol_id AND rm.modulo_id = m.modulo_id
  AND LOWER(r.nombre) = 'voluntario' AND m.codigo IN ('personal','donaciones','seguridad');

INSERT INTO rol_modulo (rol_id, modulo_id)
SELECT r.rol_id, m.modulo_id
FROM roles r, cat_modulos m
WHERE LOWER(r.nombre) = 'voluntario' AND m.codigo IN
  ('analytics','emergencias','inventario','finanzas','vehiculos','reportes')
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 5. VERIFICACIÓN
-- ──────────────────────────────────────────────────────────────
SELECT r.nombre AS rol, COUNT(rp.permiso_id) AS permisos
FROM roles r
LEFT JOIN rol_permisos rp ON rp.rol_id = r.rol_id
GROUP BY r.rol_id, r.nombre
ORDER BY r.rol_id;

SELECT r.nombre AS rol, COUNT(rm.modulo_id) AS modulos
FROM roles r
LEFT JOIN rol_modulo rm ON rm.rol_id = r.rol_id
GROUP BY r.rol_id, r.nombre
ORDER BY r.rol_id;

SELECT COUNT(*) AS total_permisos FROM permisos;
