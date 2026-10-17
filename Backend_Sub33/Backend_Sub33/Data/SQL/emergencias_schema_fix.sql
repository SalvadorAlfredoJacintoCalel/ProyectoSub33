-- ============================================================================
-- Emergencias — Ajustes de esquema (IDEMPOTENTE, NO destructivo)
-- Alinea la BD con lo que el código/DTOs usan y con el formulario físico.
-- Seguro de ejecutar múltiples veces. NO elimina datos ni tablas existentes.
-- ============================================================================

-- ── 1. Columnas que el código espera en emergencias_servicios ────────────────
ALTER TABLE emergencias_servicios
    ADD COLUMN IF NOT EXISTS hospital_destino_nombre VARCHAR(150) NULL;

ALTER TABLE emergencias_servicios
    ADD COLUMN IF NOT EXISTS estado_entrega VARCHAR(100) NULL;

ALTER TABLE emergencias_servicios
    ADD COLUMN IF NOT EXISTS unidad_asignada_nombre VARCHAR(150) NULL;

-- ── 2. Catálogo de roles de servicio (usado por el JOIN del servicio) ─────────
CREATE TABLE IF NOT EXISTS cat_roles_servicio (
    rol_servicio_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Solo roles operativos del formulario físico. Se eliminan roles de sistema
-- que hubieran quedado por error en este catálogo (FK es ON DELETE SET NULL).
DELETE FROM cat_roles_servicio
WHERE LOWER(nombre) NOT IN ('piloto', 'camillero', 'socorrista');

INSERT INTO cat_roles_servicio (nombre, descripcion) VALUES
    ('Piloto', 'Conduce la unidad / ambulancia'),
    ('Camillero', 'Asiste el traslado del paciente'),
    ('Socorrista', 'Brinda atención prehospitalaria')
ON CONFLICT (nombre) DO NOTHING;

-- ── 3. Drift servicio_personal_asignado: agregar rol_servicio_id ─────────────
-- (se conserva rol_en_servicio para no romper datos existentes)
ALTER TABLE servicio_personal_asignado
    ADD COLUMN IF NOT EXISTS rol_servicio_id INT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_spa_rol_servicio'
          AND table_name = 'servicio_personal_asignado'
    ) THEN
        ALTER TABLE servicio_personal_asignado
            ADD CONSTRAINT fk_spa_rol_servicio
            FOREIGN KEY (rol_servicio_id) REFERENCES cat_roles_servicio(rol_servicio_id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- ── 4. Catálogo: Estado al entregar en hospital ─────────────────────────────
CREATE TABLE IF NOT EXISTS cat_estados_entrega (
    estado_entrega_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO cat_estados_entrega (nombre, descripcion) VALUES
    ('Estable', 'Paciente estable al entregar'),
    ('Delicado', 'Paciente en estado delicado'),
    ('Grave', 'Paciente en estado grave'),
    ('Fallecido en traslado', 'Paciente fallecido durante el traslado')
ON CONFLICT (nombre) DO NOTHING;

-- ── 5. Insumos utilizados por servicio (integración con Inventario) ──────────
CREATE TABLE IF NOT EXISTS servicio_insumos_utilizados (
    servicio_id INT NOT NULL,
    item_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 0,
    CONSTRAINT pk_servicio_insumos PRIMARY KEY (servicio_id, item_id),
    CONSTRAINT fk_siu_servicio FOREIGN KEY (servicio_id)
        REFERENCES emergencias_servicios(servicio_id) ON DELETE CASCADE
);

-- ── 6. Tipos de asistencia (etiquetas del formulario físico) ─────────────────
CREATE TABLE IF NOT EXISTS cat_tipos_asistencia (
    tipo_asistencia_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO cat_tipos_asistencia (nombre) VALUES
    ('Maternidad'),
    ('Accidente de tránsito'),
    ('Accidente de trabajo'),
    ('Servicio Social'),
    ('Prevención'),
    ('Capacitación'),
    ('Otros')
ON CONFLICT (nombre) DO NOTHING;

-- ── 7. Hospitales del formulario físico (se conservan los ya existentes) ─────
INSERT INTO cat_hospitales (nombre, direccion, telefono, created_at) VALUES
    ('Hospitalito HOSMG', NULL, NULL, NOW()),
    ('C.A.P', NULL, NULL, NOW()),
    ('Clínica de especialidades Vida', NULL, NULL, NOW()),
    ('Tecniscan Escuintla', NULL, NULL, NOW())
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================================
-- Verificación rápida
-- ============================================================================
-- SELECT * FROM cat_roles_servicio ORDER BY rol_servicio_id;
-- SELECT * FROM cat_estados_entrega ORDER BY estado_entrega_id;
-- SELECT * FROM cat_tipos_asistencia ORDER BY tipo_asistencia_id;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'emergencias_servicios';
