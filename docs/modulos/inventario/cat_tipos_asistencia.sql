-- Tipos de Asistencia (para sección "Tipos de Asistencia" en Emergencias)
-- Datos del formato físico de la hoja de servicio
CREATE TABLE IF NOT EXISTS cat_tipos_asistencia (
    tipo_asistencia_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

TRUNCATE cat_tipos_asistencia RESTART IDENTITY;

INSERT INTO cat_tipos_asistencia (nombre) VALUES
('Maternidad'),
('Accidente de tránsito'),
('Accidente de trabajo'),
('Servicio Social'),
('Prevención'),
('Capacitación'),
('Otros');
