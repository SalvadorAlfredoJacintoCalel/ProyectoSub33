-- Migración única: agrega los permisos granulares del módulo Finanzas
-- y los otorga al administrador (usuario 'admin' y rol admin/administrador).
-- Ejecutar una sola vez en la base de datos (Neon).

-- 1. Permisos de finanzas (módulo 4)
INSERT INTO public.permisos (permiso_id, codigo, modulo_id, descripcion, created_at, nombre) VALUES
    (121, 'finanzas.ver', 4, 'Consultar transacciones y el resumen financiero', CURRENT_TIMESTAMP, 'Ver finanzas'),
    (122, 'finanzas.crear', 4, 'Registrar una nueva transacción', CURRENT_TIMESTAMP, 'Crear transacción'),
    (123, 'finanzas.editar', 4, 'Editar una transacción registrada', CURRENT_TIMESTAMP, 'Editar transacción'),
    (124, 'finanzas.eliminar', 4, 'Eliminar una transacción', CURRENT_TIMESTAMP, 'Eliminar transacción')
ON CONFLICT DO NOTHING;

-- 2. Otorgar al usuario admin (override explícito)
INSERT INTO public.usuario_permisos (usuario_id, permiso_id)
SELECT u.usuario_id, p.permiso_id
FROM public.usuarios u
JOIN public.permisos p ON p.codigo IN ('finanzas.ver', 'finanzas.crear', 'finanzas.editar', 'finanzas.eliminar')
WHERE LOWER(u.username) = 'admin'
ON CONFLICT DO NOTHING;

-- 3. Otorgar al rol administrador (heredado por otros admins)
INSERT INTO public.rol_permisos (rol_id, permiso_id)
SELECT r.rol_id, p.permiso_id
FROM public.roles r
JOIN public.permisos p ON p.codigo IN ('finanzas.ver', 'finanzas.crear', 'finanzas.editar', 'finanzas.eliminar')
WHERE LOWER(r.nombre) IN ('admin', 'administrador')
ON CONFLICT DO NOTHING;

-- 4. Avanzar la secuencia para no pisar los ids manuales
SELECT setval(
    'public.permisos_permiso_id_seq',
    GREATEST((SELECT MAX(permiso_id) FROM public.permisos), 184),
    true
);
