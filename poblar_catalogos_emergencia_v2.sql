-- ============================================================================
-- SCRIPT PARA POBLAR CATÁLOGOS DEL MÓDULO DE EMERGENCIA
-- Ejecutar en pgAdmin o psql contra la base de datos Sub_33
-- ============================================================================

-- ============================================================================
-- 1. TIPOS DE EMERGENCIA (cat_tipos_emergencia)
-- ============================================================================
INSERT INTO cat_tipos_emergencia (tipo, descripcion, requiere_unidad, color_hex, created_at) VALUES
('Accidente de Tránsito', 'Choque, colisión o atropello vehicular', true, '#DC2626', NOW()),
('Incendio Estructural', 'Incendio en vivienda, comercio o industria', true, '#EA580C', NOW()),
('Incendio Forestal', 'Incendio en zona boscosa o pastizal', true, '#EA580C', NOW()),
('Incendio Vehicular', 'Incendio en vehículo automotor', true, '#EA580C', NOW()),
('Incendio Industrial', 'Incendio en fábrica, bodega o industria', true, '#EA580C', NOW()),
('Rescate Vehicular', 'Personas atrapadas en vehículo accidentado', true, '#EA580C', NOW()),
('Rescate en Altura', 'Personas atrapadas en altura', true, '#F59E0B', NOW()),
('Rescate en Espacios Confinados', 'Personas atrapadas en espacios cerrados', true, '#F59E0B', NOW()),
('Rescate Acuático', 'Personas en peligro en cuerpos de agua', true, '#0EA5E9', NOW()),
('Emergencia Médica', 'Emergencia médica no traumática', false, '#10B981', NOW()),
('Maternidad / Parto', 'Asistencia a parto o emergencia obstétrica', false, '#EC4899', NOW()),
('Traslado Médico', 'Traslado interhospitalario o a centro de salud', false, '#3B82F6', NOW()),
('Incendio Vehicular', 'Incendio en vehículo automotor', true, '#EA580C', NOW()),
('Fuga de Gas / Químicos', 'Fuga de sustancias peligrosas', true, '#F59E0B', NOW()),
('Derrumbe / Colapso Estructural', 'Colapso de edificación o estructura', true, '#DC2626', NOW()),
('Incidente con Material Peligroso', 'Derrame o exposición a sustancias peligrosas', true, '#DC2626', NOW()),
('Rescate Animal', 'Rescate de animales en riesgo', false, '#6366F1', NOW()),
('Otro', 'Otro tipo de emergencia no clasificada', false, '#6B7280', NOW())
ON CONFLICT (tipo) DO NOTHING;

-- ============================================================================
-- 2. TIPOS DE UNIDAD (cat_tipos_unidad)
-- ============================================================================
INSERT INTO cat_tipos_unidad (nombre, descripcion) VALUES
('Ambulancia', 'Ambulancia de emergencia médica'),
('Autobomba', 'Vehículo cisterna para combate de incendios', NOW()),
('Unidad de Rescate', 'Vehículo equipado para rescate técnico', NOW()),
('Carro Bomba', 'Vehículo cisterna para combate de incendios', NOW()),
('Escalera Mecánica', 'Escalera telescópica para rescate en altura', NOW()),
('Unidad de Rescate Ligero', 'Vehículo ligero para rescate urbano', NOW()),
('Unidad de Mando', 'Vehículo de comando y control', NOW()),
('Unidad de Apoyo', 'Vehículo de apoyo logístico', NOW()),
('Motobomba', 'Motobomba portátil para abastecimiento', NOW()),
('Tanque de Agua', 'Cisterna de agua para abastecimiento', NOW())
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================================
-- 3. HOSPITALES (cat_hospitales)
-- ============================================================================
INSERT INTO cat_hospitales (nombre, direccion, telefono, created_at) VALUES
('Hospital Nacional de Sololá', 'San Lucas Tolimán, Sololá', '7932-1234', NOW()),
('Centro de Salud San Lucas Tolimán', 'San Lucas Tolimán, Sololá', '7932-1235', NOW()),
('IGSS Regional Sololá', 'San Lucas Tolimán, Sololá', '7932-1236', NOW()),
('Hospital Nacional de Antigua Guatemala', 'Antigua Guatemala, Sacatepéquez', '7832-1234', NOW()),
('Hospital Nacional de Chimaltenango', 'Chimaltenango', '7832-1234', NOW()),
('Hospital Regional de Occidente', 'Quetzaltenango', '7761-1234', NOW()),
('Hospital Roosevelt', 'Ciudad de Guatemala', '2301-1234', NOW()),
('Hospital San Juan de Dios', 'Ciudad de Guatemala', '2301-1234', NOW()),
('Hospital General San Juan de Dios', 'Ciudad de Guatemala', '2301-1235', NOW()),
('Hospital General de Enfermedades', 'Ciudad de Guatemala', '2301-1236', NOW()),
('Hospital General San Juan de Dios', 'Ciudad de Guatemala', '2301-1235', NOW()),
('Hospital General de Enfermedades', 'Ciudad de Guatemala', '2301-1236', NOW())
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================================
-- 4. TIPOS DE UNIDAD (cat_tipos_unidad) - Insertar primero para FK
-- ============================================================================
INSERT INTO cat_tipos_unidad (nombre, descripcion) VALUES
('Ambulancia', 'Ambulancia de emergencia médica'),
('Autobomba', 'Vehículo cisterna para combate de incendios'),
('Unidad de Rescate', 'Vehículo equipado para rescate técnico'),
('Carro Bomba', 'Vehículo cisterna para combate de incendios'),
('Escalera Mecánica', 'Escalera telescópica para rescate en altura'),
('Unidad de Rescate Ligero', 'Vehículo ligero para rescate urbano'),
('Unidad de Mando', 'Vehículo de comando y control'),
('Unidad de Apoyo', 'Vehículo de apoyo logístico'),
('Motobomba', 'Motobomba portátil para abastecimiento'),
('Tanque de Agua', 'Cisterna de agua para abastecimiento')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================================
-- 3. HOSPITALES (cat_hospitales)
-- ============================================================================
INSERT INTO cat_hospitales (nombre, direccion, telefono, created_at) VALUES
('Hospital Nacional de Sololá', 'San Lucas Tolimán, Sololá', '7932-1234', NOW()),
('Centro de Salud San Lucas Tolimán', 'San Lucas Tolimán, Sololá', '7932-1235', NOW()),
('IGSS Regional Sololá', 'San Lucas Tolimán, Sololá', '7932-1236', NOW()),
('Hospital Nacional de Antigua Guatemala', 'Antigua Guatemala, Sacatepéquez', '7832-1234', NOW()),
('Hospital Nacional de Chimaltenango', 'Chimaltenango', '7832-1234', NOW()),
('Hospital Regional de Occidente', 'Quetzaltenango', '7761-1234', NOW()),
('Hospital Roosevelt', 'Ciudad de Guatemala', '2301-1234', NOW()),
('Hospital San Juan de Dios', 'Ciudad de Guatemala', '2301-1234', NOW()),
('Hospital General San Juan de Dios', 'Ciudad de Guatemala', '2301-1235', NOW()),
('Hospital General de Enfermedades', 'Ciudad de Guatemala', '2301-1236', NOW()),
('Hospital General San Juan de Dios', 'Ciudad de Guatemala', '2301-1235', NOW()),
('Hospital General de Enfermedades', 'Ciudad de Guatemala', '2301-1236', NOW())
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================================
-- 4. UNIDADES (cat_unidades) - después de insertar tipos_unidad
-- ============================================================================
-- Obtener IDs de tipos de unidad
DO $$
DECLARE
    v_ambulancia_id INT;
    v_autobomba_id INT;
    v_rescate_id INT;
    v_carro_bomba_id INT;
    v_escalera_id INT;
    v_rescate_ligero_id INT;
    v_mando_id INT;
    v_apoyo_id INT;
    v_motobomba_id INT;
    v_tanque_id INT;
BEGIN
    SELECT tipo_unidad_id INTO v_ambulancia_id FROM cat_tipos_unidad WHERE nombre = 'Ambulancia';
    SELECT tipo_unidad_id INTO v_autobomba_id FROM cat_tipos_unidad WHERE nombre = 'Autobomba';
    SELECT tipo_unidad_id INTO v_rescate_id FROM cat_tipos_unidad WHERE nombre = 'Unidad de Rescate';
    SELECT tipo_unidad_id INTO v_carro_bomba_id FROM cat_tipos_unidad WHERE nombre = 'Carro Bomba';
    SELECT tipo_unidad_id INTO v_escalera_id FROM cat_tipos_unidad WHERE nombre = 'Escalera Mecánica';
    SELECT tipo_unidad_id INTO v_rescate_ligero_id FROM cat_tipos_unidad WHERE nombre = 'Unidad de Rescate Ligero';
    SELECT tipo_unidad_id INTO v_mando_id FROM cat_tipos_unidad WHERE nombre = 'Unidad de Mando';
    SELECT tipo_unidad_id INTO v_apoyo_id FROM cat_tipos_unidad WHERE nombre = 'Unidad de Apoyo';
    SELECT tipo_unidad_id INTO v_motobomba_id FROM cat_tipos_unidad WHERE nombre = 'Motobomba';
    SELECT tipo_unidad_id INTO v_tanque_id FROM cat_tipos_unidad WHERE nombre = 'Tanque de Agua';

    INSERT INTO cat_unidades (codigo_unidad, tipo_unidad_id, placa, estado, created_at) VALUES
    ('A-33', v_ambulancia_id, 'BOM-001', 'Disponible', NOW()),
    ('B-12', v_autobomba_id, 'BOM-012', 'Disponible', NOW()),
    ('R-5', v_rescate_id, 'BOM-003', 'Disponible', NOW()),
    ('E-44', v_carro_bomba_id, 'BOM-004', 'Disponible', NOW()),
    ('R-5', v_escalera_id, 'BOM-005', 'Disponible', NOW()),
    ('U-22', 3, 'BOM-006', 'Disponible', NOW()),  -- Rescate Ligero
    ('U-33', 1, 'BOM-007', 'Disponible', NOW()),  -- Ambulancia
    ('BD-01', 2, 'BOM-008', 'Disponible', NOW()),  -- Autobomba
    ('AD-02', 8, 'BOM-009', 'Disponible', NOW()),  -- Mando
    ('V-33', 1, 'BOM-010', 'Disponible', NOW())   -- Ambulancia
    ON CONFLICT (codigo_unidad) DO NOTHING;
END $$;

-- ============================================================================
-- VERIFICACIÓN: Consultar datos insertados
-- ============================================================================
-- SELECT * FROM cat_tipos_emergencia ORDER BY tipo_emergencia_id;
-- SELECT * FROM cat_tipos_unidad ORDER BY tipo_unidad_id;
-- SELECT * FROM cat_hospitales ORDER BY hospital_id;
-- SELECT * FROM cat_unidades ORDER BY unidad_id;
-- SELECT * FROM cat_roles_servicio ORDER BY rol_servicio_id;