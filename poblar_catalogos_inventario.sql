-- ============================================================================
-- SCRIPT PARA POBLAR CATÁLOGOS BASE DEL MÓDULO DE INVENTARIO
-- Ejecutar en la base de datos Sub_33
-- ============================================================================

-- 1. Tipos de Movimiento (Kardex)
INSERT INTO cat_tipos_movimiento (codigo, descripcion) VALUES
('ENTRADA', 'Entrada'),
('SALIDA', 'Salida'),
('AJUSTE', 'Ajuste'),
('BAJA', 'Baja'),
('USO_SERVICIO', 'Uso en Servicio')
ON CONFLICT (codigo) DO NOTHING;

-- 2. Categorías de Inventario (insumos + equipo unificados)
INSERT INTO cat_categorias_inventario (nombre, descripcion) VALUES
('Medicamentos', 'Medicamentos y fármacos'),
('Material de Curación', 'Gasas, vendas, apósitos'),
('EPP', 'Equipo de Protección Personal'),
('Equipo de Rescate', 'Herramientas y equipo de rescate'),
('Extinción', 'Equipo de extinción de incendios'),
('Herramientas', 'Herramientas generales'),
('Mobiliario', 'Mobiliario y enseres'),
('Otros Insumos', 'Insumos varios')
ON CONFLICT (nombre) DO NOTHING;
