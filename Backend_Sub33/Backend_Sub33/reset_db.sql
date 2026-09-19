-- Drop and recreate database
DROP DATABASE IF EXISTS "Sub_33";
CREATE DATABASE "Sub_33" WITH ENCODING='UTF8' LC_COLLATE='Spanish_Colombia.1252' LC_CTYPE='Spanish_Colombia.1252' TEMPLATE=template0;
\c "Sub_33";

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- configuracion_listas_maestras
CREATE TABLE configuracion_listas_maestras (
    lista_id SERIAL PRIMARY KEY,
    categoria VARCHAR(100) NOT NULL,
    opcion VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (categoria, opcion)
);

-- cat_rangos
CREATE TABLE cat_rangos (
    rango_id SERIAL PRIMARY KEY,
    rango VARCHAR(50) NOT NULL,
    minimo INTEGER NOT NULL,
    maximo INTEGER NOT NULL
);

-- cat_tipos_emergencia
CREATE TABLE cat_tipos_emergencia (
    tipo_emergencia_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(200)
);

-- cat_hospitales
CREATE TABLE cat_hospitales (
    hospital_id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    direccion VARCHAR(200),
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(20)
);

-- personal
CREATE TABLE personal (
    personal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primer_nombre VARCHAR(100) NOT NULL,
    segundo_nombre VARCHAR(100),
    primer_apellido VARCHAR(100) NOT NULL,
    segundo_apellido VARCHAR(100),
    dpi VARCHAR(20) NOT NULL UNIQUE,
    fecha_nacimiento DATE,
    rango_id INTEGER REFERENCES cat_rangos(rango_id) ON DELETE SET NULL,
    fecha_ingreso DATE NOT NULL,
    telefono VARCHAR(20),
    estado BOOLEAN DEFAULT TRUE,
    contacto_emergencia_nombre VARCHAR(150),
    contacto_emergencia_telefono VARCHAR(20)
);

-- usuarios
CREATE TABLE usuarios (
    usuario_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id UUID REFERENCES personal(personal_id) ON DELETE SET NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- roles
CREATE TABLE roles (
    rol_id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255)
);

-- permisos
CREATE TABLE permisos (
    permiso_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255)
);

-- usuario_roles
CREATE TABLE usuario_roles (
    usuario_id UUID NOT NULL REFERENCES usuarios(usuario_id) ON DELETE CASCADE,
    rol_id VARCHAR(50) NOT NULL REFERENCES roles(rol_id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, rol_id)
);

-- rol_permisos
CREATE TABLE rol_permisos (
    rol_id VARCHAR(50) NOT NULL REFERENCES roles(rol_id) ON DELETE CASCADE,
    permiso_id UUID NOT NULL REFERENCES permisos(permiso_id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
);

-- Seed: Roles mínimos
INSERT INTO roles (rol_id, nombre, descripcion) VALUES 
    ('ADMIN', 'Administrador', 'Acceso total al sistema'),
    ('OPERADOR', 'Operador', 'Acceso a operaciones'),
    ('SUPERVISOR', 'Supervisor', 'Acceso a supervisión y reportes');

-- Seed: CatRangos básicos
INSERT INTO cat_rangos (rango, minimo, maximo) VALUES 
    ('Bombero I', 1, 10),
    ('Bombero II', 11, 20),
    ('Cabo', 21, 30),
    ('Sargento', 31, 40),
    ('Teniente', 41, 50),
    ('Capitán', 51, 60);

-- Seed: CatTiposEmergencia básicos
INSERT INTO cat_tipos_emergencia (nombre, descripcion) VALUES 
    ('Incendio estructural', 'Incendio en edificio o estructura'),
    ('Incendio forestal', 'Incendio en zona boscosa o pastizal'),
    ('Rescate vehicular', 'Rescate en accidente de tránsito'),
    ('Rescate en altura', 'Rescate en lugares elevados'),
    ('Emergencia médica', 'Atención prehospitalaria'),
    ('Materiales peligrosos', 'Incidente con sustancias químicas'),
    ('Inundación', 'Emergencia por desbordamiento o lluvia'),
    ('Otros', 'Otras emergencias no clasificadas');

-- Seed: CatHospitales básicos
INSERT INTO cat_hospitales (nombre, direccion, ciudad, codigo_postal) VALUES 
    ('Hospital General', 'Av. Principal 123', 'Ciudad Capital', '01001'),
    ('Clínica Central', 'Calle 45 #67-89', 'Ciudad Capital', '01002'),
    ('Hospital Regional Norte', 'Carrera 10 #20-30', 'Ciudad Norte', '02001');

-- Seed: ConfiguracionListaMaestra - categorías para selects
INSERT INTO configuracion_listas_maestras (categoria, opcion) VALUES 
    ('tipo_sangre', 'A+'),
    ('tipo_sangre', 'A-'),
    ('tipo_sangre', 'B+'),
    ('tipo_sangre', 'B-'),
    ('tipo_sangre', 'AB+'),
    ('tipo_sangre', 'AB-'),
    ('tipo_sangre', 'O+'),
    ('tipo_sangre', 'O-'),
    ('eps', 'Nueva EPS'),
    ('eps', 'Sanitas'),
    ('eps', 'Sura'),
    ('eps', 'Coomeva'),
    ('eps', 'Medimás'),
    ('arl', 'Positiva'),
    ('arl', 'Sura'),
    ('arl', 'Colmena'),
    ('arl', 'Equidad'),
    ('estado_civil', 'Soltero'),
    ('estado_civil', 'Casado'),
    ('estado_civil', 'Divorciado'),
    ('estado_civil', 'Viudo'),
    ('genero', 'Masculino'),
    ('genero', 'Femenino'),
    ('nivel_escolaridad', 'Primaria'),
    ('nivel_escolaridad', 'Secundaria'),
    ('nivel_escolaridad', 'Técnico'),
    ('nivel_escolaridad', 'Tecnólogo'),
    ('nivel_escolaridad', 'Profesional'),
    ('nivel_escolaridad', 'Posgrado');

-- Verificación
SELECT 'Tablas creadas:' as info;
\dt

SELECT 'Roles:' as info;
SELECT rol_id, nombre FROM roles;

SELECT 'CatRangos:' as info;
SELECT rango_id, rango FROM cat_rangos;

SELECT 'CatTiposEmergencia:' as info;
SELECT tipo_emergencia_id, nombre FROM cat_tipos_emergencia;

SELECT 'CatHospitales:' as info;
SELECT hospital_id, nombre FROM cat_hospitales;

SELECT 'ConfiguracionListasMaestras:' as info;
SELECT categoria, COUNT(*) as total FROM configuracion_listas_maestras GROUP BY categoria;