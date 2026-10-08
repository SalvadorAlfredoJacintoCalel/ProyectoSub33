-- ==========================================
-- DATOS DE EJEMPLO - MÓDULO INVENTARIO
-- Ejecutar en PostgreSQL (Base de datos: Sub_33)
-- ==========================================

-- 1. Categorías de Inventario
INSERT INTO cat_categorias_inventario (nombre, descripcion) VALUES
('Medicamentos', 'Medicamentos y fármacos'),
('Material de Curación', 'Material de curación y primeros auxilios'),
('EPP', 'Equipo de Protección Personal'),
('Otros Insumos', 'Otros insumos varios'),
('Rescate', 'Equipo de rescate'),
('Extinción', 'Equipo de extinción de incendios'),
('Embarcaciones', 'Embarcaciones y equipo acuático'),
('Mobiliario', 'Mobiliario y equipo de oficina')
ON CONFLICT (nombre) DO NOTHING;

-- 2. Proveedores
INSERT INTO cat_proveedores (nombre_empresa, nit, contacto_nombre, telefono) VALUES
('Farmacias Simán', '1234567-8', 'Juan Pérez', '2234-5678'),
('MediSupply Guatemala', '8765432-1', 'María López', '2345-6789'),
('Seguridad Industrial GT', '1122334-4', 'Carlos Ruiz', '3456-7890'),
('Equipos Bomberos SA', '5566778-9', 'Ana Martínez', '4567-8901'),
('Suministros Médicos GT', '9988776-6', 'Luis García', '5678-9012')
ON CONFLICT (nombre_empresa) DO NOTHING;

-- 3. Tipos de Movimiento
INSERT INTO cat_tipos_movimiento (codigo, descripcion) VALUES
('ENTRADA', 'Entrada de inventario'),
('SALIDA', 'Salida de inventario'),
('AJUSTE', 'Ajuste de inventario'),
('BAJA', 'Baja de inventario'),
('TRANSFERENCIA', 'Transferencia entre unidades'),
('USO_SERVICIO', 'Uso en servicio de emergencia')
ON CONFLICT (codigo) DO NOTHING;

-- 4. Unidades (si no existen)
INSERT INTO cat_unidades (codigo_unidad, tipo_unidad_id, placa, estado) VALUES
('A-33', 1, 'BOM-001', 'Disponible'),
('B-12', 2, 'BOM-002', 'Disponible'),
('R-5', 3, 'BOM-003', 'Disponible'),
('E-44', 4, 'BOM-004', 'Disponible'),
('BD-01', 5, 'BOM-005', 'Disponible')
ON CONFLICT (codigo_unidad) DO NOTHING;

-- 5. Items de Inventario
INSERT INTO inventario_items (categoria_inv_id, proveedor_id, codigo_barras, nombre, stock_actual, stock_minimo, unidad_medida) VALUES
(1, 1, 'MED-001', 'Paracetamol 500mg', 100, 20, 'comprimidos'),
(1, 1, 'MED-002', 'Ibuprofeno 400mg', 80, 15, 'comprimidos'),
(1, 2, 'MED-003', 'Amoxicilina 500mg', 50, 10, 'cápsulas'),
(2, 2, 'MAT-001', 'Vendas de gasa', 200, 50, 'unidades'),
(2, 2, 'MAT-002', 'Algodón estéril', 150, 30, 'paquetes'),
(2, 3, 'MAT-003', 'Alcohol isopropílico', 30, 10, 'botellas'),
(3, 3, 'EPP-001', 'Cascos de seguridad', 25, 5, 'unidades'),
(3, 3, 'EPP-002', 'Guantes de nitrilo', 500, 100, 'pares'),
(3, 4, 'EPP-003', 'Gafas de seguridad', 40, 8, 'unidades'),
(4, 4, 'OTR-001', 'Bolsas de basura', 100, 20, 'unidades'),
(5, 5, 'RES-001', 'Cuerdas de rescate', 15, 3, 'unidades'),
(5, 5, 'RES-002', 'Arneses de seguridad', 20, 5, 'unidades'),
(6, 5, 'EXT-001', 'Mangueras de incendio', 10, 2, 'unidades'),
(6, 5, 'EXT-002', 'Extintores ABC', 30, 6, 'unidades'),
(7, 5, 'EMB-001', 'Chalecos salvavidas', 25, 5, 'unidades'),
(8, 5, 'MOB-001', 'Sillas de oficina', 50, 10, 'unidades'),
(8, 5, 'MOB-002', 'Escritorios', 20, 4, 'unidades')
ON CONFLICT (codigo_barras) DO NOTHING;

-- ==========================================
-- VERIFICACIÓN
-- ==========================================
SELECT 'categorias' as tabla, COUNT(*) as total FROM cat_categorias_inventario
UNION ALL
SELECT 'proveedores', COUNT(*) FROM cat_proveedores
UNION ALL
SELECT 'tipos_movimiento', COUNT(*) FROM cat_tipos_movimiento
UNION ALL
SELECT 'unidades', COUNT(*) FROM cat_unidades
UNION ALL
SELECT 'items', COUNT(*) FROM inventario_items;
