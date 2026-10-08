-- Tipos de Asistencia (para sección "Tipos de Asistencia" en Emergencias)
CREATE TABLE IF NOT EXISTS cat_tipos_asistencia (
    tipo_asistencia_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO cat_tipos_asistencia (nombre) VALUES
('Quemado'), ('Fractura'), ('Herida'), ('Intoxicación'), ('Ahogamiento'),
('Parto'), ('Paro Cardíaco'), ('Shock'), ('Hemorragia'), ('Traumatismo'),
('Químico'), ('Eléctrico'), ('Mordedura'), ('Picadura'), ('Otro')
ON CONFLICT (nombre) DO NOTHING;
