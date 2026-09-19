-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CONFIGURACIÓN Y CATÁLOGOS BASE

-- Tabla: configuracion_listas_maestras
DROP TABLE IF EXISTS configuracion_listas_maestras CASCADE;
CREATE TABLE configuracion_listas_maestras (
lista_id SERIAL PRIMARY KEY,
categoria VARCHAR(100) NOT NULL,
opcion VARCHAR(150) NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT uk_categoria_opcion UNIQUE (categoria, opcion)
);
CREATE INDEX idx_config_categoria ON configuracion_listas_maestras(categoria);

-- Tabla: parametros_sistema
DROP TABLE IF EXISTS parametros_sistema CASCADE;
CREATE TABLE parametros_sistema (
parametro_id SERIAL PRIMARY KEY,
clave VARCHAR(100) NOT NULL UNIQUE,
valor TEXT NOT NULL,
descripcion TEXT,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: cat_rangos
DROP TABLE IF EXISTS cat_rangos CASCADE;
CREATE TABLE cat_rangos (
rango_id SERIAL PRIMARY KEY,
rango VARCHAR(50) NOT NULL UNIQUE,
descripcion TEXT,
activo BOOLEAN DEFAULT TRUE NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: cat_tipos_emergencia
DROP TABLE IF EXISTS cat_tipos_emergencia CASCADE;
CREATE TABLE cat_tipos_emergencia (
tipo_emergencia_id SERIAL PRIMARY KEY,
tipo VARCHAR(100) NOT NULL UNIQUE,
descripcion TEXT,
requiere_unidad BOOLEAN DEFAULT FALSE NOT NULL,
color_hex VARCHAR(7) DEFAULT '#D32F2F',
activo BOOLEAN DEFAULT TRUE NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: cat_hospitales
DROP TABLE IF EXISTS cat_hospitales CASCADE;
CREATE TABLE cat_hospitales (
hospital_id SERIAL PRIMARY KEY,
nombre VARCHAR(150) NOT NULL UNIQUE,
direccion TEXT,
telefono VARCHAR(20),
activo BOOLEAN DEFAULT TRUE NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USUARIOS, PERSONAL Y SEGURIDAD

-- Tabla: personal
DROP TABLE IF EXISTS personal CASCADE;
CREATE TABLE personal (
personal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
primer_nombre VARCHAR(50) NOT NULL,
segundo_nombre VARCHAR(50) NULL,
primer_apellido VARCHAR(50) NOT NULL,
segundo_apellido VARCHAR(50) NULL,
dpi VARCHAR(20) NOT NULL UNIQUE,
fecha_nacimiento DATE NULL,
rango_id INT NULL,
fecha_ingreso DATE NOT NULL,
telefono VARCHAR(20) NOT NULL,
estado BOOLEAN DEFAULT TRUE NOT NULL,
contacto_emergencia_nombre VARCHAR(100) NOT NULL,
contacto_emergencia_telefono VARCHAR(20) NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_personal_rango FOREIGN KEY (rango_id) REFERENCES cat_rangos(rango_id) ON DELETE SET NULL
);

-- Tabla: usuarios
DROP TABLE IF EXISTS usuarios CASCADE;
CREATE TABLE usuarios (
usuario_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
personal_id UUID UNIQUE NULL,
username VARCHAR(50) NOT NULL UNIQUE,
password_hash VARCHAR(255) NOT NULL,
estado BOOLEAN DEFAULT TRUE NOT NULL,
ultimo_login TIMESTAMP WITH TIME ZONE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_usuarios_personal FOREIGN KEY (personal_id) REFERENCES personal(personal_id) ON DELETE CASCADE
);

-- Tabla: roles
DROP TABLE IF EXISTS roles CASCADE;
CREATE TABLE roles (
rol_id SERIAL PRIMARY KEY,
nombre VARCHAR(50) NOT NULL UNIQUE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: permisos
DROP TABLE IF EXISTS permisos CASCADE;
CREATE TABLE permisos (
permiso_id SERIAL PRIMARY KEY,
codigo VARCHAR(50) NOT NULL UNIQUE,
modulo VARCHAR(50) NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: rol_permisos
DROP TABLE IF EXISTS rol_permisos CASCADE;
CREATE TABLE rol_permisos (
rol_id INT NOT NULL,
permiso_id INT NOT NULL,
CONSTRAINT pk_rol_permisos PRIMARY KEY (rol_id, permiso_id),
CONSTRAINT fk_rp_rol FOREIGN KEY (rol_id) REFERENCES roles(rol_id) ON DELETE CASCADE,
CONSTRAINT fk_rp_permiso FOREIGN KEY (permiso_id) REFERENCES permisos(permiso_id) ON DELETE CASCADE
);

-- Tabla: usuario_roles
DROP TABLE IF EXISTS usuario_roles CASCADE;
CREATE TABLE usuario_roles (
usuario_id UUID NOT NULL,
rol_id INT NOT NULL,
CONSTRAINT pk_usuario_roles PRIMARY KEY (usuario_id, rol_id),
CONSTRAINT fk_usuario_roles_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE CASCADE,
CONSTRAINT fk_usuario_roles_rol FOREIGN KEY (rol_id) REFERENCES roles(rol_id) ON DELETE CASCADE
);

-- Tabla: sesiones_activas
DROP TABLE IF EXISTS sesiones_activas CASCADE;
CREATE TABLE sesiones_activas (
sesion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
usuario_id UUID NOT NULL,
token_hash VARCHAR(255) NOT NULL,
expira_en TIMESTAMP WITH TIME ZONE NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_sesiones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE CASCADE
);

-- Tabla: bitacora_accesos
DROP TABLE IF EXISTS bitacora_accesos CASCADE;
CREATE TABLE bitacora_accesos (
bitacora_id SERIAL PRIMARY KEY,
usuario_id UUID NULL,
ip_origen VARCHAR(45),
evento VARCHAR(100) NOT NULL,
exitoso BOOLEAN NOT NULL,
fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_bitacora_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE SET NULL
);

-- Tabla: codigos_recuperacion
DROP TABLE IF EXISTS codigos_recuperacion CASCADE;
CREATE TABLE codigos_recuperacion (
codigo_id SERIAL PRIMARY KEY,
usuario_id UUID NOT NULL,
codigo_otp VARCHAR(6) NOT NULL,
telefono_destino VARCHAR(20) NOT NULL,
expira_en TIMESTAMP WITH TIME ZONE NOT NULL,
usado BOOLEAN DEFAULT FALSE NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_codigos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE CASCADE
);

-- 3. EMERGENCIAS Y SERVICIOS

-- Tabla: emergencias_servicios
DROP TABLE IF EXISTS emergencias_servicios CASCADE;
CREATE TABLE emergencias_servicios (
servicio_id SERIAL PRIMARY KEY,
numero_incidente VARCHAR(30) NOT NULL UNIQUE,
fecha DATE DEFAULT CURRENT_DATE NOT NULL,
hora_salida TIME NULL,
hora_entrada TIME NULL,
solicitud_tipo VARCHAR(50) DEFAULT 'Telefónica',
paciente VARCHAR(200) NOT NULL,
edad INT NULL,
genero VARCHAR(20) DEFAULT 'No especificado',
solicitante VARCHAR(200) NULL,
acompañante VARCHAR(200) NULL,
domicilio TEXT NULL,
fallecio BOOLEAN DEFAULT FALSE NOT NULL,
ubicacion TEXT NOT NULL,
tipo_emergencia_id INT NULL,
hospital_destino_id INT NULL,
hospital_destino_nombre VARCHAR(150) NULL,
estado_entrega VARCHAR(100) NULL,
unidad_asignada_id INT NULL,
formulado_por_id UUID NULL,
creado_por_nombre VARCHAR(150) DEFAULT 'Bombero',
resumen TEXT NULL,
estado VARCHAR(10) DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_servicios_tipo FOREIGN KEY (tipo_emergencia_id) REFERENCES cat_tipos_emergencia(tipo_emergencia_id) ON DELETE SET NULL,
CONSTRAINT fk_servicios_hospital FOREIGN KEY (hospital_destino_id) REFERENCES cat_hospitales(hospital_id) ON DELETE SET NULL,
CONSTRAINT fk_servicios_formulador FOREIGN KEY (formulado_por_id) REFERENCES personal(personal_id) ON DELETE SET NULL
);

-- Tabla: revision_nuevas_opciones
DROP TABLE IF EXISTS revision_nuevas_opciones CASCADE;
CREATE TABLE revision_nuevas_opciones (
revision_id SERIAL PRIMARY KEY,
servicio_id INT NULL,
categoria VARCHAR(100) NOT NULL,
texto_observacion TEXT NOT NULL,
revisado BOOLEAN DEFAULT FALSE NOT NULL,
atendido_por_usuario_id UUID NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_revision_servicio FOREIGN KEY (servicio_id) REFERENCES emergencias_servicios(servicio_id) ON DELETE SET NULL,
CONSTRAINT fk_revision_admin FOREIGN KEY (atendido_por_usuario_id) REFERENCES usuarios(usuario_id) ON DELETE SET NULL
);

CREATE INDEX idx_revision_pendiente ON revision_nuevas_opciones(revisado) WHERE revisado = FALSE;

-- Tabla: servicio_tipos_asistencia
DROP TABLE IF EXISTS servicio_tipos_asistencia CASCADE;
CREATE TABLE servicio_tipos_asistencia (
servicio_id INT NOT NULL,
tipo_asistencia VARCHAR(100) NOT NULL,
CONSTRAINT pk_servicio_asistencia PRIMARY KEY (servicio_id, tipo_asistencia),
CONSTRAINT fk_sta_servicio FOREIGN KEY (servicio_id) REFERENCES emergencias_servicios(servicio_id) ON DELETE CASCADE
);

-- Tabla: servicio_personal_asignado
DROP TABLE IF EXISTS servicio_personal_asignado CASCADE;
CREATE TABLE servicio_personal_asignado (
servicio_id INT NOT NULL,
personal_id UUID NULL,
nombre_personal VARCHAR(150) NOT NULL,
rol_en_servicio VARCHAR(50) DEFAULT 'Socorrista',
CONSTRAINT pk_servicio_personal PRIMARY KEY (servicio_id, nombre_personal),
CONSTRAINT fk_spa_servicio FOREIGN KEY (servicio_id) REFERENCES emergencias_servicios(servicio_id) ON DELETE CASCADE,
CONSTRAINT fk_spa_personal FOREIGN KEY (personal_id) REFERENCES personal(personal_id) ON DELETE SET NULL
);

-- Tabla: signos_vitales_paciente
DROP TABLE IF EXISTS signos_vitales_paciente CASCADE;
CREATE TABLE signos_vitales_paciente (
signo_id SERIAL PRIMARY KEY,
servicio_id INT NOT NULL UNIQUE,
presion_arterial VARCHAR(20) NULL,
frecuencia_cardiaca INT NULL,
frecuencia_respiratoria INT NULL,
saturacion_oxigeno INT NULL,
hora_toma TIME DEFAULT CURRENT_TIME,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_svp_servicio FOREIGN KEY (servicio_id) REFERENCES emergencias_servicios(servicio_id) ON DELETE CASCADE
);

SELECT 'Base de datos reiniciada exitosamente. Todas las tablas están vacías.' AS resultado;