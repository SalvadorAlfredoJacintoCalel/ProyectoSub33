-- ============================================================
-- MIGRACIÓN: Módulo Vehículos (flota, cupones) + Libro de Donaciones
-- Base de datos: Sub_33 (PostgreSQL)
-- Idempotente: se puede ejecutar más de una vez.
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1. Catálogos
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cat_tipos_vehiculo (
    tipo_vehiculo_id SERIAL PRIMARY KEY,
    nombre           VARCHAR(80) NOT NULL UNIQUE,
    descripcion      VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS cat_gasolineras (
    gasolinera_id SERIAL PRIMARY KEY,
    nombre        VARCHAR(120) NOT NULL UNIQUE,
    descripcion   VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS cat_talleres (
    taller_id   SERIAL PRIMARY KEY,
    nombre      VARCHAR(150) NOT NULL UNIQUE,
    descripcion VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS cat_tipos_documento (
    tipo_documento_id SERIAL PRIMARY KEY,
    nombre            VARCHAR(80) NOT NULL UNIQUE,
    descripcion       VARCHAR(200)
);

-- ────────────────────────────────────────────────────────────
-- 2. Flota
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehiculos (
    vehiculo_id       SERIAL PRIMARY KEY,
    codigo            VARCHAR(30) UNIQUE,
    tipo_id           INT REFERENCES cat_tipos_vehiculo(tipo_vehiculo_id),
    marca             VARCHAR(80) NOT NULL,
    modelo            VARCHAR(80) NOT NULL,
    anio              INT,
    color             VARCHAR(40),
    placa             VARCHAR(20),
    chasis            VARCHAR(80),
    motor             VARCHAR(80),
    no_unidad         VARCHAR(30),
    combustible       VARCHAR(30),
    capacidad_tanque  NUMERIC(8,2),
    kilometraje       INT NOT NULL DEFAULT 0,
    condicion_llantas VARCHAR(20),
    seguro_hasta      DATE,
    estado_operativo  VARCHAR(20) NOT NULL DEFAULT 'Operativa'
                      CHECK (estado_operativo IN ('Operativa', 'En Servicio', 'Mantenimiento', 'Fuera de Servicio')),
    origen            VARCHAR(20) NOT NULL DEFAULT 'Compra Propia'
                      CHECK (origen IN ('Compra Propia', 'Donado')),
    donacion_id       INT REFERENCES donaciones(donacion_id) ON DELETE SET NULL,
    estado            VARCHAR(20) NOT NULL DEFAULT 'Activo'
                      CHECK (estado IN ('Activo', 'Inactivo')),
    valor_unitario    NUMERIC(12,2) NOT NULL DEFAULT 0,
    ubicacion         VARCHAR(120),
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_vehiculos_placa ON vehiculos(placa);
CREATE INDEX IF NOT EXISTS ix_vehiculos_codigo ON vehiculos(codigo);
CREATE INDEX IF NOT EXISTS ix_vehiculos_estado ON vehiculos(estado, estado_operativo);

CREATE TABLE IF NOT EXISTS vehiculo_mantenimientos (
    mantenimiento_id SERIAL PRIMARY KEY,
    vehiculo_id      INT NOT NULL REFERENCES vehiculos(vehiculo_id) ON DELETE CASCADE,
    taller_id        INT REFERENCES cat_talleres(taller_id),
    tipo             VARCHAR(20) NOT NULL DEFAULT 'Preventivo'
                     CHECK (tipo IN ('Preventivo', 'Correctivo')),
    fecha_ingreso    DATE NOT NULL,
    fecha_retorno    DATE,
    kilometraje      INT,
    descripcion      TEXT,
    costo            NUMERIC(12,2) NOT NULL DEFAULT 0,
    estado           VARCHAR(20) NOT NULL DEFAULT 'En proceso'
                     CHECK (estado IN ('En proceso', 'Finalizado')),
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_mantenimientos_vehiculo ON vehiculo_mantenimientos(vehiculo_id, fecha_ingreso DESC);

-- ────────────────────────────────────────────────────────────
-- 3. Cupones de combustible (libro mensual con saldo corrido)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehiculo_cupones_periodos (
    periodo_id          SERIAL PRIMARY KEY,
    anio                INT NOT NULL,
    mes                 INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    cupon_inicial_del   BIGINT,
    cupon_inicial_al    BIGINT,
    total_recibidos     INT NOT NULL DEFAULT 0,
    valor_cupon_default NUMERIC(12,2) NOT NULL DEFAULT 100,
    haber_inicial       NUMERIC(12,2) NOT NULL DEFAULT 0,
    saldo_inicial       NUMERIC(12,2) NOT NULL DEFAULT 0,
    saldo_final         NUMERIC(12,2) NOT NULL DEFAULT 0,
    notas               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (anio, mes)
);

CREATE TABLE IF NOT EXISTS vehiculo_cupones (
    registro_id    SERIAL PRIMARY KEY,
    periodo_id     INT NOT NULL REFERENCES vehiculo_cupones_periodos(periodo_id) ON DELETE CASCADE,
    vehiculo_id    INT REFERENCES vehiculos(vehiculo_id) ON DELETE SET NULL,
    fecha          DATE NOT NULL,
    responsable    VARCHAR(150) NOT NULL,
    kilometraje    INT,
    galonaje       NUMERIC(10,2),
    comision_no    INT,
    gasolinera_id  INT REFERENCES cat_gasolineras(gasolinera_id),
    cupon_del      BIGINT NOT NULL,
    cupon_al       BIGINT NOT NULL,
    total_cupones  INT NOT NULL DEFAULT 0,
    valor_cupon    NUMERIC(12,2) NOT NULL DEFAULT 100,
    haber          NUMERIC(12,2) NOT NULL DEFAULT 0,
    firmado        BOOLEAN NOT NULL DEFAULT FALSE,
    saldo          NUMERIC(12,2) NOT NULL DEFAULT 0,
    observaciones  TEXT,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (cupon_al >= cupon_del)
);

CREATE INDEX IF NOT EXISTS ix_cupones_periodo ON vehiculo_cupones(periodo_id, fecha, registro_id);
CREATE INDEX IF NOT EXISTS ix_cupones_vehiculo ON vehiculo_cupones(vehiculo_id);

-- ────────────────────────────────────────────────────────────
-- 4. Libro de donaciones (Entrada / Salida / Saldo)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donacion_libros (
    libro_id      SERIAL PRIMARY KEY,
    anio          INT NOT NULL,
    mes           INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    saldo_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
    saldo_final   NUMERIC(12,2) NOT NULL DEFAULT 0,
    notas         TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (anio, mes)
);

CREATE TABLE IF NOT EXISTS donacion_movimientos (
    movimiento_id     SERIAL PRIMARY KEY,
    libro_id          INT NOT NULL REFERENCES donacion_libros(libro_id) ON DELETE CASCADE,
    fecha             DATE NOT NULL,
    descripcion       TEXT NOT NULL,
    firmado           BOOLEAN NOT NULL DEFAULT FALSE,
    tipo_documento_id INT REFERENCES cat_tipos_documento(tipo_documento_id),
    no_documento      VARCHAR(60),
    entrada           NUMERIC(12,2) NOT NULL DEFAULT 0,
    salida            NUMERIC(12,2) NOT NULL DEFAULT 0,
    saldo             NUMERIC(12,2) NOT NULL DEFAULT 0,
    donacion_id       INT REFERENCES donaciones(donacion_id) ON DELETE SET NULL,
    vehiculo_id       INT REFERENCES vehiculos(vehiculo_id) ON DELETE SET NULL,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_movimientos_libro ON donacion_movimientos(libro_id, fecha, movimiento_id);
CREATE INDEX IF NOT EXISTS ix_movimientos_donacion ON donacion_movimientos(donacion_id);
CREATE INDEX IF NOT EXISTS ix_movimientos_vehiculo ON donacion_movimientos(vehiculo_id);

-- ────────────────────────────────────────────────────────────
-- 5. Vínculo Vehículo → Inventario valorizado (idempotente)
-- ────────────────────────────────────────────────────────────
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS vehiculo_id INT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'inventario_items_vehiculo_id_fkey'
    ) THEN
        ALTER TABLE inventario_items
            ADD CONSTRAINT inventario_items_vehiculo_id_fkey
            FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(vehiculo_id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_inventario_items_vehiculo
    ON inventario_items(vehiculo_id) WHERE vehiculo_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- 6. Seeds de catálogos
-- ────────────────────────────────────────────────────────────
INSERT INTO cat_tipos_vehiculo (nombre, descripcion) VALUES
    ('Ambulancia', 'Unidad de traslado y atención prehospitalaria'),
    ('Bombatanque', 'Vehículo cisterna para combate de incendios'),
    ('Autobomba', 'Vehículo con bomba para incendios'),
    ('Vehículo de Rescate', 'Unidad de rescate'),
    ('Motobomba', 'Unidad ligera con motobomba'),
    ('Lancha', 'Embarcación de rescate acuático'),
    ('Pick-Up', 'Camioneta de apoyo logístico'),
    ('Hidrodeslizador', 'Unidad acuática rápida')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_gasolineras (nombre) VALUES
    ('Shell Jireh Panajachel'),
    ('Shell Atitlán Panajachel'),
    ('Shell Patzi Chimaltenango'),
    ('Shell San Cristóbal Patulul'),
    ('Shell Atitlán Panajachel')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_talleres (nombre) VALUES
    ('Taller Mecánico El Lago'),
    ('Taller Municipal'),
    ('Taller Especializado'),
    ('Otro')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_tipos_documento (nombre) VALUES
    ('Acta'),
    ('Recibo'),
    ('Carta'),
    ('Otro')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_categorias_inventario (nombre, descripcion) VALUES
    ('Vehículos', 'Vehículos de la subestación')
ON CONFLICT (nombre) DO NOTHING;

COMMIT;
