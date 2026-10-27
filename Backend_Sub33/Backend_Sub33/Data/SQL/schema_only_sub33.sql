-- ============================================================================
-- Subestación 33 — Esquema completo (SOLO ESTRUCTURA) para PostgreSQL
-- Generado automáticamente a partir de init.sql (fuente autoritativa de la BD).
--
-- Incluye: extensiones, función immutable_unaccent, secuencias, tablas,
--          restricciones (PK/UNIQUE/FK) e índices.
-- Excluye: TODOS los datos (bloques COPY), setval y datos de prueba.
--
-- Datos mínimos al final: 3 roles (admin/voluntario/secretario) + 1 usuario
-- admin inicial. Contraseña temporal: Sub33.Temp.2026!  (cambio obligatorio).
--
-- Compatibilidad: PostgreSQL 15/16/17 (Neon). Se eliminó la variable
-- transaction_timeout (solo existe en PG17+) y los meta-comandos de
-- restricción de pg_dump 18 (restrict/unrestrict).
--
-- Uso:  psql "postgresql://USER:PASS@HOST/db?sslmode=require" -f schema_only_sub33.sql
-- ============================================================================

BEGIN;

SET statement_timeout = 0;

SET lock_timeout = 0;

SET idle_in_transaction_session_timeout = 0;

SET client_encoding = 'UTF8';

SET standard_conforming_strings = on;

SELECT pg_catalog.set_config('search_path', '', false);

SET check_function_bodies = false;

SET xmloption = content;

SET client_min_messages = warning;

SET row_security = off;

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';

CREATE OR REPLACE FUNCTION public.immutable_unaccent(text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
    AS $_$
    SELECT public.unaccent('public.unaccent', $1)
$_$;

SET default_tablespace = '';

SET default_table_access_method = heap;

CREATE TABLE IF NOT EXISTS public."__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bitacora_accesos (
    bitacora_id integer NOT NULL,
    usuario_id uuid,
    ip_origen character varying(45),
    evento character varying(100) NOT NULL,
    exitoso boolean NOT NULL,
    fecha_hora timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.bitacora_accesos_bitacora_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.bitacora_accesos_bitacora_id_seq OWNED BY public.bitacora_accesos.bitacora_id;

CREATE TABLE IF NOT EXISTS public.bitacora_cambios (
    cambio_id integer NOT NULL,
    tabla_afectada character varying(100) NOT NULL,
    registro_id character varying(100) NOT NULL,
    accion character varying(20) NOT NULL,
    datos_anteriores jsonb,
    datos_nuevos jsonb,
    usuario_id uuid,
    fecha_hora timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.bitacora_cambios_cambio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.bitacora_cambios_cambio_id_seq OWNED BY public.bitacora_cambios.cambio_id;

CREATE TABLE IF NOT EXISTS public.cat_categorias_inventario (
    categoria_inv_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text
);

CREATE SEQUENCE IF NOT EXISTS public.cat_categorias_inventario_categoria_inv_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_categorias_inventario_categoria_inv_id_seq OWNED BY public.cat_categorias_inventario.categoria_inv_id;

CREATE TABLE IF NOT EXISTS public.cat_especialidades (
    especialidad_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text
);

CREATE SEQUENCE IF NOT EXISTS public.cat_especialidades_especialidad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_especialidades_especialidad_id_seq OWNED BY public.cat_especialidades.especialidad_id;

CREATE TABLE IF NOT EXISTS public.cat_estados_entrega (
    estado_entrega_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.cat_estados_entrega_estado_entrega_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_estados_entrega_estado_entrega_id_seq OWNED BY public.cat_estados_entrega.estado_entrega_id;

CREATE TABLE IF NOT EXISTS public.cat_gasolineras (
    gasolinera_id integer NOT NULL,
    nombre character varying(120) NOT NULL,
    descripcion character varying(200)
);

CREATE SEQUENCE IF NOT EXISTS public.cat_gasolineras_gasolinera_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_gasolineras_gasolinera_id_seq OWNED BY public.cat_gasolineras.gasolinera_id;

CREATE TABLE IF NOT EXISTS public.cat_hospitales (
    hospital_id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    direccion text,
    telefono character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.cat_hospitales_hospital_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_hospitales_hospital_id_seq OWNED BY public.cat_hospitales.hospital_id;

CREATE TABLE IF NOT EXISTS public.cat_modulos (
    modulo_id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text
);

CREATE SEQUENCE IF NOT EXISTS public.cat_modulos_modulo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_modulos_modulo_id_seq OWNED BY public.cat_modulos.modulo_id;

CREATE TABLE IF NOT EXISTS public.cat_proveedores (
    proveedor_id integer NOT NULL,
    nombre_empresa character varying(150) NOT NULL,
    nit character varying(20),
    contacto_nombre character varying(100),
    telefono character varying(20)
);

CREATE SEQUENCE IF NOT EXISTS public.cat_proveedores_proveedor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_proveedores_proveedor_id_seq OWNED BY public.cat_proveedores.proveedor_id;

CREATE TABLE IF NOT EXISTS public.cat_rangos (
    rango_id integer NOT NULL,
    rango character varying(50) NOT NULL,
    descripcion text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.cat_rangos_rango_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_rangos_rango_id_seq OWNED BY public.cat_rangos.rango_id;

CREATE TABLE IF NOT EXISTS public.cat_roles_servicio (
    rol_servicio_id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text
);

CREATE SEQUENCE IF NOT EXISTS public.cat_roles_servicio_rol_servicio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_roles_servicio_rol_servicio_id_seq OWNED BY public.cat_roles_servicio.rol_servicio_id;

CREATE TABLE IF NOT EXISTS public.cat_talleres (
    taller_id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    direccion text,
    telefono character varying(20)
);

CREATE SEQUENCE IF NOT EXISTS public.cat_talleres_taller_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_talleres_taller_id_seq OWNED BY public.cat_talleres.taller_id;

CREATE TABLE IF NOT EXISTS public.cat_tipos_asistencia (
    tipo_asistencia_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.cat_tipos_asistencia_tipo_asistencia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_tipos_asistencia_tipo_asistencia_id_seq OWNED BY public.cat_tipos_asistencia.tipo_asistencia_id;

CREATE TABLE IF NOT EXISTS public.cat_tipos_documento (
    tipo_documento_id integer NOT NULL,
    nombre character varying(80) NOT NULL,
    descripcion character varying(200)
);

CREATE SEQUENCE IF NOT EXISTS public.cat_tipos_documento_tipo_documento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_tipos_documento_tipo_documento_id_seq OWNED BY public.cat_tipos_documento.tipo_documento_id;

CREATE TABLE IF NOT EXISTS public.cat_tipos_emergencia (
    tipo_emergencia_id integer NOT NULL,
    tipo character varying(100) NOT NULL,
    descripcion text,
    requiere_unidad boolean DEFAULT false NOT NULL,
    color_hex character varying(7) DEFAULT '#D32F2F'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.cat_tipos_emergencia_tipo_emergencia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_tipos_emergencia_tipo_emergencia_id_seq OWNED BY public.cat_tipos_emergencia.tipo_emergencia_id;

CREATE TABLE IF NOT EXISTS public.cat_tipos_mantenimiento (
    tipo_mantenimiento_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text
);

CREATE SEQUENCE IF NOT EXISTS public.cat_tipos_mantenimiento_tipo_mantenimiento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_tipos_mantenimiento_tipo_mantenimiento_id_seq OWNED BY public.cat_tipos_mantenimiento.tipo_mantenimiento_id;

CREATE TABLE IF NOT EXISTS public.cat_tipos_movimiento (
    tipo_mov_id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    descripcion character varying(100) NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.cat_tipos_movimiento_tipo_mov_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_tipos_movimiento_tipo_mov_id_seq OWNED BY public.cat_tipos_movimiento.tipo_mov_id;

CREATE TABLE IF NOT EXISTS public.cat_tipos_unidad (
    tipo_unidad_id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text
);

CREATE SEQUENCE IF NOT EXISTS public.cat_tipos_unidad_tipo_unidad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_tipos_unidad_tipo_unidad_id_seq OWNED BY public.cat_tipos_unidad.tipo_unidad_id;

CREATE TABLE IF NOT EXISTS public.cat_tipos_vehiculo (
    tipo_vehiculo_id integer NOT NULL,
    nombre character varying(80) NOT NULL,
    descripcion character varying(200)
);

CREATE SEQUENCE IF NOT EXISTS public.cat_tipos_vehiculo_tipo_vehiculo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_tipos_vehiculo_tipo_vehiculo_id_seq OWNED BY public.cat_tipos_vehiculo.tipo_vehiculo_id;

CREATE TABLE IF NOT EXISTS public.cat_unidades (
    unidad_id integer NOT NULL,
    codigo_unidad character varying(20) NOT NULL,
    tipo_unidad_id integer NOT NULL,
    placa character varying(15),
    estado character varying(30) DEFAULT 'Disponible'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.cat_unidades_unidad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cat_unidades_unidad_id_seq OWNED BY public.cat_unidades.unidad_id;

CREATE TABLE IF NOT EXISTS public.codigos_recuperacion (
    codigo_id integer NOT NULL,
    usuario_id uuid NOT NULL,
    telefono_destino character varying(20),
    expira_en timestamp with time zone NOT NULL,
    usado boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    email_destino character varying(255),
    codigo_otp_hash character varying(64)
);

CREATE SEQUENCE IF NOT EXISTS public.codigos_recuperacion_codigo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.codigos_recuperacion_codigo_id_seq OWNED BY public.codigos_recuperacion.codigo_id;

CREATE TABLE IF NOT EXISTS public.control_combustible (
    combustible_id integer NOT NULL,
    unidad_id integer NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    galones numeric(8,2) NOT NULL,
    costo_total numeric(10,2) NOT NULL,
    kilometraje integer NOT NULL,
    conductor_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.control_combustible_combustible_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.control_combustible_combustible_id_seq OWNED BY public.control_combustible.combustible_id;

CREATE TABLE IF NOT EXISTS public.direcciones_personal (
    direccion_id integer NOT NULL,
    personal_id uuid NOT NULL,
    departamento character varying(100) DEFAULT 'Guatemala'::character varying,
    municipio character varying(100) NOT NULL,
    zona character varying(10),
    direccion_detalle text NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.direcciones_personal_direccion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.direcciones_personal_direccion_id_seq OWNED BY public.direcciones_personal.direccion_id;

CREATE TABLE IF NOT EXISTS public.donacion_libros (
    libro_id integer NOT NULL,
    anio integer NOT NULL,
    mes integer NOT NULL,
    saldo_inicial numeric(12,2) DEFAULT 0 NOT NULL,
    saldo_final numeric(12,2) DEFAULT 0 NOT NULL,
    notas text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT donacion_libros_mes_check CHECK (((mes >= 1) AND (mes <= 12)))
);

CREATE SEQUENCE IF NOT EXISTS public.donacion_libros_libro_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.donacion_libros_libro_id_seq OWNED BY public.donacion_libros.libro_id;

CREATE TABLE IF NOT EXISTS public.donacion_movimientos (
    movimiento_id integer NOT NULL,
    libro_id integer NOT NULL,
    fecha date NOT NULL,
    descripcion text NOT NULL,
    firmado boolean DEFAULT false NOT NULL,
    tipo_documento_id integer,
    no_documento character varying(60),
    entrada numeric(12,2) DEFAULT 0 NOT NULL,
    salida numeric(12,2) DEFAULT 0 NOT NULL,
    saldo numeric(12,2) DEFAULT 0 NOT NULL,
    donacion_id integer,
    vehiculo_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.donacion_movimientos_movimiento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.donacion_movimientos_movimiento_id_seq OWNED BY public.donacion_movimientos.movimiento_id;

CREATE TABLE IF NOT EXISTS public.donaciones (
    donacion_id integer NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    no_recibo character varying(50) NOT NULL,
    donante character varying(200) NOT NULL,
    dpi_nit character varying(20),
    telefono character varying(20),
    tipo character varying(20) NOT NULL,
    categoria character varying(50),
    descripcion text,
    monto numeric(12,2) DEFAULT 0,
    estado character varying(20) DEFAULT 'Pendiente'::character varying,
    metodo_pago character varying(20),
    no_comprobante character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT donaciones_estado_check CHECK (((estado)::text = ANY ((ARRAY['Pendiente'::character varying, 'Confirmado'::character varying, 'Procesado'::character varying])::text[]))),
    CONSTRAINT donaciones_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['Monetaria'::character varying, 'Material'::character varying])::text[])))
);

CREATE SEQUENCE IF NOT EXISTS public.donaciones_donacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.donaciones_donacion_id_seq OWNED BY public.donaciones.donacion_id;

CREATE TABLE IF NOT EXISTS public.emergencias_servicios (
    servicio_id integer NOT NULL,
    numero_incidente character varying(30) NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    hora_salida time without time zone,
    hora_entrada time without time zone,
    solicitud_tipo character varying(50) DEFAULT 'Telefónica'::character varying,
    paciente character varying(200) NOT NULL,
    edad integer,
    genero character varying(20) DEFAULT 'No especificado'::character varying,
    solicitante character varying(200),
    acompanante character varying(200),
    domicilio text,
    fallecio boolean DEFAULT false NOT NULL,
    ubicacion text NOT NULL,
    tipo_emergencia_id integer,
    hospital_destino_id integer,
    unidad_asignada_id integer,
    formulado_por_id uuid,
    creado_por_nombre character varying(150) DEFAULT 'Bombero'::character varying,
    resumen text,
    estado character varying(10) DEFAULT 'Activo'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    hospital_destino_nombre character varying(150),
    estado_entrega character varying(100),
    unidad_asignada_nombre character varying(150),
    vehiculo_id integer,
    CONSTRAINT emergencias_servicios_estado_check CHECK (((estado)::text = ANY ((ARRAY['En proceso'::character varying, 'Terminado'::character varying, 'Inactivo'::character varying])::text[])))
);

CREATE SEQUENCE IF NOT EXISTS public.emergencias_servicios_servicio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.emergencias_servicios_servicio_id_seq OWNED BY public.emergencias_servicios.servicio_id;

CREATE TABLE IF NOT EXISTS public.equipo_unidades (
    unidad_id integer NOT NULL,
    item_id integer NOT NULL,
    cantidad_asignada integer DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.finanzas_transacciones (
    transaccion_id bigint NOT NULL,
    tipo character varying(20) NOT NULL,
    descripcion character varying(500) NOT NULL,
    monto numeric(14,2) NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    referencia character varying(100),
    responsable_id uuid NOT NULL,
    responsable_nombre character varying(200) NOT NULL,
    modulo_origen character varying(50),
    referencia_origen character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT finanzas_transacciones_monto_check CHECK ((monto > (0)::numeric)),
    CONSTRAINT finanzas_transacciones_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['INGRESO'::character varying, 'GASTO'::character varying, 'DONACION'::character varying])::text[])))
);

CREATE SEQUENCE IF NOT EXISTS public.finanzas_transacciones_transaccion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.finanzas_transacciones_transaccion_id_seq OWNED BY public.finanzas_transacciones.transaccion_id;

CREATE TABLE IF NOT EXISTS public.hospital_contactos (
    contacto_id integer NOT NULL,
    hospital_id integer NOT NULL,
    area character varying(100) NOT NULL,
    telefono character varying(20) NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.hospital_contactos_contacto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.hospital_contactos_contacto_id_seq OWNED BY public.hospital_contactos.contacto_id;

CREATE TABLE IF NOT EXISTS public.inventario_items (
    item_id integer NOT NULL,
    categoria_inv_id integer NOT NULL,
    proveedor_id integer,
    codigo_barras character varying(50),
    nombre character varying(150) NOT NULL,
    stock_actual integer DEFAULT 0 NOT NULL,
    stock_minimo integer DEFAULT 0 NOT NULL,
    unidad_medida character varying(30) DEFAULT 'Unidad'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    donacion_id integer,
    origen character varying(20) DEFAULT 'Compra Propia'::character varying,
    nombre_donante character varying(150),
    no_recibo character varying(50),
    valor_unitario numeric(12,2),
    estado character varying(10) DEFAULT 'Activo'::character varying NOT NULL,
    fecha_baja date,
    ubicacion character varying(120),
    es_central boolean DEFAULT false NOT NULL,
    vehiculo_id integer,
    CONSTRAINT inventario_items_origen_check CHECK (((origen)::text = ANY ((ARRAY['Compra Propia'::character varying, 'Donado'::character varying])::text[])))
);

CREATE SEQUENCE IF NOT EXISTS public.inventario_items_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.inventario_items_item_id_seq OWNED BY public.inventario_items.item_id;

CREATE TABLE IF NOT EXISTS public.inventario_movimientos (
    movimiento_id integer NOT NULL,
    item_id integer NOT NULL,
    tipo_mov_id integer NOT NULL,
    cantidad integer NOT NULL,
    motivo text NOT NULL,
    responsable_id uuid,
    fecha_hora timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.inventario_movimientos_movimiento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.inventario_movimientos_movimiento_id_seq OWNED BY public.inventario_movimientos.movimiento_id;

CREATE TABLE IF NOT EXISTS public.mantenimiento_unidades (
    mantenimiento_id integer NOT NULL,
    unidad_id integer NOT NULL,
    taller_id integer NOT NULL,
    tipo_mantenimiento_id integer NOT NULL,
    descripcion text NOT NULL,
    costo numeric(10,2) DEFAULT 0.00,
    fecha_mantenimiento date NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.mantenimiento_unidades_mantenimiento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.mantenimiento_unidades_mantenimiento_id_seq OWNED BY public.mantenimiento_unidades.mantenimiento_id;

CREATE TABLE IF NOT EXISTS public.materiales_donacion (
    material_id integer NOT NULL,
    donacion_id integer NOT NULL,
    descripcion character varying(200) NOT NULL,
    cantidad integer DEFAULT 1 NOT NULL,
    valor_estimado numeric(12,2) DEFAULT 0,
    categoria character varying(50)
);

CREATE SEQUENCE IF NOT EXISTS public.materiales_donacion_material_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.materiales_donacion_material_id_seq OWNED BY public.materiales_donacion.material_id;

CREATE TABLE IF NOT EXISTS public.novedades_estacion (
    novedad_id integer NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    hora time without time zone DEFAULT CURRENT_TIME NOT NULL,
    descripcion text NOT NULL,
    registrado_por_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.novedades_estacion_novedad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.novedades_estacion_novedad_id_seq OWNED BY public.novedades_estacion.novedad_id;

CREATE TABLE IF NOT EXISTS public.parametros_sistema (
    parametro_id integer NOT NULL,
    clave character varying(100) NOT NULL,
    valor text NOT NULL,
    descripcion text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.parametros_sistema_parametro_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.parametros_sistema_parametro_id_seq OWNED BY public.parametros_sistema.parametro_id;

CREATE TABLE IF NOT EXISTS public.permisos (
    permiso_id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    modulo_id integer NOT NULL,
    descripcion text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    nombre character varying(100) DEFAULT ''::character varying NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.permisos_permiso_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.permisos_permiso_id_seq OWNED BY public.permisos.permiso_id;

CREATE TABLE IF NOT EXISTS public.personal (
    personal_id uuid DEFAULT gen_random_uuid() NOT NULL,
    primer_nombre character varying(50) NOT NULL,
    segundo_nombre character varying(50),
    primer_apellido character varying(50) NOT NULL,
    segundo_apellido character varying(50),
    dpi character varying(20) NOT NULL,
    fecha_nacimiento date,
    rango_id integer,
    fecha_ingreso date NOT NULL,
    telefono character varying(20) NOT NULL,
    estado boolean DEFAULT true NOT NULL,
    contacto_emergencia_nombre character varying(100) NOT NULL,
    contacto_emergencia_telefono character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    codigo_bombero character varying(30),
    search_text text GENERATED ALWAYS AS (public.immutable_unaccent(lower((((((((((((((COALESCE(primer_nombre, ''::character varying))::text || ' '::text) || (COALESCE(segundo_nombre, ''::character varying))::text) || ' '::text) || (COALESCE(primer_apellido, ''::character varying))::text) || ' '::text) || (COALESCE(segundo_apellido, ''::character varying))::text) || ' '::text) || (COALESCE(codigo_bombero, ''::character varying))::text) || ' '::text) || (COALESCE(dpi, ''::character varying))::text) || ' '::text) || (COALESCE(telefono, ''::character varying))::text)))) STORED
);

CREATE TABLE IF NOT EXISTS public.personal_especialidades (
    personal_id uuid NOT NULL,
    especialidad_id integer NOT NULL,
    fecha_acreditacion date DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public.programacion_turnos (
    turno_id integer NOT NULL,
    personal_id uuid NOT NULL,
    fecha_turno date NOT NULL,
    tipo_turno character varying(50) DEFAULT '24 Horas'::character varying NOT NULL,
    observacion text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.programacion_turnos_turno_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.programacion_turnos_turno_id_seq OWNED BY public.programacion_turnos.turno_id;

CREATE TABLE IF NOT EXISTS public.reportes_generados (
    reporte_id integer NOT NULL,
    titulo character varying(150) NOT NULL,
    tipo_reporte character varying(50) NOT NULL,
    parametros_json jsonb,
    generado_por_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.reportes_generados_reporte_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.reportes_generados_reporte_id_seq OWNED BY public.reportes_generados.reporte_id;

CREATE TABLE IF NOT EXISTS public.rol_modulo (
    rol_id integer NOT NULL,
    modulo_id integer NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rol_permisos (
    rol_id integer NOT NULL,
    permiso_id integer NOT NULL
);

CREATE TABLE IF NOT EXISTS public.roles (
    rol_id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.roles_rol_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.roles_rol_id_seq OWNED BY public.roles.rol_id;

CREATE TABLE IF NOT EXISTS public.servicio_insumos_utilizados (
    servicio_id integer NOT NULL,
    item_id integer NOT NULL,
    cantidad integer NOT NULL
);

CREATE TABLE IF NOT EXISTS public.servicio_personal_asignado (
    servicio_id integer NOT NULL,
    personal_id uuid,
    nombre_personal character varying(150) NOT NULL,
    rol_servicio_id integer
);

CREATE TABLE IF NOT EXISTS public.servicio_tipos_asistencia (
    servicio_id integer NOT NULL,
    tipo_asistencia character varying(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sesiones_activas (
    sesion_id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expira_en timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.signos_vitales_paciente (
    signo_id integer NOT NULL,
    servicio_id integer NOT NULL,
    presion_arterial character varying(20),
    frecuencia_cardiaca integer,
    frecuencia_respiratoria integer,
    saturacion_oxigeno integer,
    hora_toma time without time zone DEFAULT CURRENT_TIME,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.signos_vitales_paciente_signo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.signos_vitales_paciente_signo_id_seq OWNED BY public.signos_vitales_paciente.signo_id;

CREATE TABLE IF NOT EXISTS public.usuario_modulos (
    usuario_id uuid NOT NULL,
    modulo_id integer NOT NULL
);

CREATE TABLE IF NOT EXISTS public.usuario_permisos (
    usuario_id uuid NOT NULL,
    permiso_id integer NOT NULL
);

CREATE TABLE IF NOT EXISTS public.usuario_roles (
    usuario_id uuid NOT NULL,
    rol_id integer NOT NULL
);

CREATE TABLE IF NOT EXISTS public.usuarios (
    usuario_id uuid DEFAULT gen_random_uuid() NOT NULL,
    personal_id uuid,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    estado boolean DEFAULT true NOT NULL,
    ultimo_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    email character varying(255),
    intentos_fallidos integer DEFAULT 0 NOT NULL,
    bloqueada boolean DEFAULT false NOT NULL,
    foto_base64 text,
    debe_cambiar_contrasena boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS public.vehiculo_cupones (
    registro_id integer NOT NULL,
    periodo_id integer NOT NULL,
    vehiculo_id integer,
    fecha date NOT NULL,
    responsable character varying(150) NOT NULL,
    kilometraje integer,
    galonaje numeric(10,2),
    comision_no integer,
    gasolinera_id integer,
    cupon_del bigint NOT NULL,
    cupon_al bigint NOT NULL,
    total_cupones integer DEFAULT 0 NOT NULL,
    valor_cupon numeric(12,2) DEFAULT 100 NOT NULL,
    haber numeric(12,2) DEFAULT 0 NOT NULL,
    firmado boolean DEFAULT false NOT NULL,
    saldo numeric(12,2) DEFAULT 0 NOT NULL,
    observaciones text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    firma_base64 text,
    activo boolean DEFAULT true NOT NULL,
    eliminado_en timestamp with time zone,
    eliminado_por_id uuid,
    eliminado_por_nombre character varying(200),
    creado_por_id uuid,
    creado_por_nombre character varying(200),
    modificado_por_id uuid,
    modificado_por_nombre character varying(200),
    modificado_en timestamp with time zone,
    CONSTRAINT vehiculo_cupones_check CHECK ((cupon_al >= cupon_del))
);

CREATE TABLE IF NOT EXISTS public.vehiculo_cupones_periodos (
    periodo_id integer NOT NULL,
    anio integer NOT NULL,
    mes integer NOT NULL,
    cupon_inicial_del bigint,
    cupon_inicial_al bigint,
    total_recibidos integer DEFAULT 0 NOT NULL,
    valor_cupon_default numeric(12,2) DEFAULT 100 NOT NULL,
    haber_inicial numeric(12,2) DEFAULT 0 NOT NULL,
    saldo_inicial numeric(12,2) DEFAULT 0 NOT NULL,
    saldo_final numeric(12,2) DEFAULT 0 NOT NULL,
    notas text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    elaborado_por character varying(150),
    jefe_abastecimientos character varying(150),
    jefe_33_cia character varying(150),
    director character varying(150),
    comision_realizada integer,
    CONSTRAINT vehiculo_cupones_periodos_mes_check CHECK (((mes >= 1) AND (mes <= 12)))
);

CREATE SEQUENCE IF NOT EXISTS public.vehiculo_cupones_periodos_periodo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.vehiculo_cupones_periodos_periodo_id_seq OWNED BY public.vehiculo_cupones_periodos.periodo_id;

CREATE SEQUENCE IF NOT EXISTS public.vehiculo_cupones_registro_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.vehiculo_cupones_registro_id_seq OWNED BY public.vehiculo_cupones.registro_id;

CREATE TABLE IF NOT EXISTS public.vehiculo_mantenimientos (
    mantenimiento_id integer NOT NULL,
    vehiculo_id integer NOT NULL,
    taller_id integer,
    tipo character varying(20) DEFAULT 'Preventivo'::character varying NOT NULL,
    fecha_ingreso date NOT NULL,
    fecha_retorno date,
    kilometraje integer,
    descripcion text,
    costo numeric(12,2) DEFAULT 0 NOT NULL,
    estado character varying(20) DEFAULT 'En proceso'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    combustible_entrada character varying(80),
    combustible_salida character varying(80),
    pedales_clutch text,
    pedales_frenos text,
    pedales_acelerador text,
    aceite_motor text,
    estado_bateria text,
    nivel_refrigerante text,
    sistema_direccion text,
    torreta_luces text,
    sirena_bocina text,
    espejo_izquierdo text,
    espejo_derecho text,
    calavera_izquierda text,
    calavera_derecha text,
    faro_izquierdo text,
    faro_derecho text,
    recomendaciones text,
    piloto_permanente character varying(150),
    piloto_voluntario character varying(150),
    escuadra character varying(100),
    horario_turno character varying(100),
    jefe_servicio character varying(150),
    firma_piloto character varying(150),
    firma_jefe_servicio character varying(150),
    CONSTRAINT vehiculo_mantenimientos_estado_check CHECK (((estado)::text = ANY ((ARRAY['En proceso'::character varying, 'Finalizado'::character varying])::text[]))),
    CONSTRAINT vehiculo_mantenimientos_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['Preventivo'::character varying, 'Correctivo'::character varying])::text[])))
);

CREATE SEQUENCE IF NOT EXISTS public.vehiculo_mantenimientos_mantenimiento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.vehiculo_mantenimientos_mantenimiento_id_seq OWNED BY public.vehiculo_mantenimientos.mantenimiento_id;

CREATE TABLE IF NOT EXISTS public.vehiculos (
    vehiculo_id integer NOT NULL,
    codigo character varying(30),
    tipo_id integer,
    marca character varying(80) NOT NULL,
    modelo character varying(80) NOT NULL,
    anio integer,
    color character varying(40),
    placa character varying(20),
    chasis character varying(80),
    motor character varying(80),
    no_unidad character varying(30),
    combustible character varying(30),
    capacidad_tanque numeric(8,2),
    kilometraje integer DEFAULT 0 NOT NULL,
    condicion_llantas character varying(20),
    seguro_hasta date,
    estado_operativo character varying(20) DEFAULT 'Operativa'::character varying NOT NULL,
    origen character varying(20) DEFAULT 'Compra Propia'::character varying NOT NULL,
    donacion_id integer,
    estado character varying(20) DEFAULT 'Activo'::character varying NOT NULL,
    valor_unitario numeric(12,2) DEFAULT 0 NOT NULL,
    ubicacion character varying(120),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    volante_direccion character varying(120),
    CONSTRAINT vehiculos_estado_check CHECK (((estado)::text = ANY ((ARRAY['Activo'::character varying, 'Inactivo'::character varying])::text[]))),
    CONSTRAINT vehiculos_estado_operativo_check CHECK (((estado_operativo)::text = ANY ((ARRAY['Operativa'::character varying, 'En Servicio'::character varying, 'Mantenimiento'::character varying, 'Fuera de Servicio'::character varying])::text[]))),
    CONSTRAINT vehiculos_origen_check CHECK (((origen)::text = ANY ((ARRAY['Compra Propia'::character varying, 'Donado'::character varying])::text[])))
);

CREATE SEQUENCE IF NOT EXISTS public.vehiculos_vehiculo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.vehiculos_vehiculo_id_seq OWNED BY public.vehiculos.vehiculo_id;

ALTER TABLE ONLY public.bitacora_accesos ALTER COLUMN bitacora_id SET DEFAULT nextval('public.bitacora_accesos_bitacora_id_seq'::regclass);

ALTER TABLE ONLY public.bitacora_cambios ALTER COLUMN cambio_id SET DEFAULT nextval('public.bitacora_cambios_cambio_id_seq'::regclass);

ALTER TABLE ONLY public.cat_categorias_inventario ALTER COLUMN categoria_inv_id SET DEFAULT nextval('public.cat_categorias_inventario_categoria_inv_id_seq'::regclass);

ALTER TABLE ONLY public.cat_especialidades ALTER COLUMN especialidad_id SET DEFAULT nextval('public.cat_especialidades_especialidad_id_seq'::regclass);

ALTER TABLE ONLY public.cat_estados_entrega ALTER COLUMN estado_entrega_id SET DEFAULT nextval('public.cat_estados_entrega_estado_entrega_id_seq'::regclass);

ALTER TABLE ONLY public.cat_gasolineras ALTER COLUMN gasolinera_id SET DEFAULT nextval('public.cat_gasolineras_gasolinera_id_seq'::regclass);

ALTER TABLE ONLY public.cat_hospitales ALTER COLUMN hospital_id SET DEFAULT nextval('public.cat_hospitales_hospital_id_seq'::regclass);

ALTER TABLE ONLY public.cat_modulos ALTER COLUMN modulo_id SET DEFAULT nextval('public.cat_modulos_modulo_id_seq'::regclass);

ALTER TABLE ONLY public.cat_proveedores ALTER COLUMN proveedor_id SET DEFAULT nextval('public.cat_proveedores_proveedor_id_seq'::regclass);

ALTER TABLE ONLY public.cat_rangos ALTER COLUMN rango_id SET DEFAULT nextval('public.cat_rangos_rango_id_seq'::regclass);

ALTER TABLE ONLY public.cat_roles_servicio ALTER COLUMN rol_servicio_id SET DEFAULT nextval('public.cat_roles_servicio_rol_servicio_id_seq'::regclass);

ALTER TABLE ONLY public.cat_talleres ALTER COLUMN taller_id SET DEFAULT nextval('public.cat_talleres_taller_id_seq'::regclass);

ALTER TABLE ONLY public.cat_tipos_asistencia ALTER COLUMN tipo_asistencia_id SET DEFAULT nextval('public.cat_tipos_asistencia_tipo_asistencia_id_seq'::regclass);

ALTER TABLE ONLY public.cat_tipos_documento ALTER COLUMN tipo_documento_id SET DEFAULT nextval('public.cat_tipos_documento_tipo_documento_id_seq'::regclass);

ALTER TABLE ONLY public.cat_tipos_emergencia ALTER COLUMN tipo_emergencia_id SET DEFAULT nextval('public.cat_tipos_emergencia_tipo_emergencia_id_seq'::regclass);

ALTER TABLE ONLY public.cat_tipos_mantenimiento ALTER COLUMN tipo_mantenimiento_id SET DEFAULT nextval('public.cat_tipos_mantenimiento_tipo_mantenimiento_id_seq'::regclass);

ALTER TABLE ONLY public.cat_tipos_movimiento ALTER COLUMN tipo_mov_id SET DEFAULT nextval('public.cat_tipos_movimiento_tipo_mov_id_seq'::regclass);

ALTER TABLE ONLY public.cat_tipos_unidad ALTER COLUMN tipo_unidad_id SET DEFAULT nextval('public.cat_tipos_unidad_tipo_unidad_id_seq'::regclass);

ALTER TABLE ONLY public.cat_tipos_vehiculo ALTER COLUMN tipo_vehiculo_id SET DEFAULT nextval('public.cat_tipos_vehiculo_tipo_vehiculo_id_seq'::regclass);

ALTER TABLE ONLY public.cat_unidades ALTER COLUMN unidad_id SET DEFAULT nextval('public.cat_unidades_unidad_id_seq'::regclass);

ALTER TABLE ONLY public.codigos_recuperacion ALTER COLUMN codigo_id SET DEFAULT nextval('public.codigos_recuperacion_codigo_id_seq'::regclass);

ALTER TABLE ONLY public.control_combustible ALTER COLUMN combustible_id SET DEFAULT nextval('public.control_combustible_combustible_id_seq'::regclass);

ALTER TABLE ONLY public.direcciones_personal ALTER COLUMN direccion_id SET DEFAULT nextval('public.direcciones_personal_direccion_id_seq'::regclass);

ALTER TABLE ONLY public.donacion_libros ALTER COLUMN libro_id SET DEFAULT nextval('public.donacion_libros_libro_id_seq'::regclass);

ALTER TABLE ONLY public.donacion_movimientos ALTER COLUMN movimiento_id SET DEFAULT nextval('public.donacion_movimientos_movimiento_id_seq'::regclass);

ALTER TABLE ONLY public.donaciones ALTER COLUMN donacion_id SET DEFAULT nextval('public.donaciones_donacion_id_seq'::regclass);

ALTER TABLE ONLY public.emergencias_servicios ALTER COLUMN servicio_id SET DEFAULT nextval('public.emergencias_servicios_servicio_id_seq'::regclass);

ALTER TABLE ONLY public.finanzas_transacciones ALTER COLUMN transaccion_id SET DEFAULT nextval('public.finanzas_transacciones_transaccion_id_seq'::regclass);

ALTER TABLE ONLY public.hospital_contactos ALTER COLUMN contacto_id SET DEFAULT nextval('public.hospital_contactos_contacto_id_seq'::regclass);

ALTER TABLE ONLY public.inventario_items ALTER COLUMN item_id SET DEFAULT nextval('public.inventario_items_item_id_seq'::regclass);

ALTER TABLE ONLY public.inventario_movimientos ALTER COLUMN movimiento_id SET DEFAULT nextval('public.inventario_movimientos_movimiento_id_seq'::regclass);

ALTER TABLE ONLY public.mantenimiento_unidades ALTER COLUMN mantenimiento_id SET DEFAULT nextval('public.mantenimiento_unidades_mantenimiento_id_seq'::regclass);

ALTER TABLE ONLY public.materiales_donacion ALTER COLUMN material_id SET DEFAULT nextval('public.materiales_donacion_material_id_seq'::regclass);

ALTER TABLE ONLY public.novedades_estacion ALTER COLUMN novedad_id SET DEFAULT nextval('public.novedades_estacion_novedad_id_seq'::regclass);

ALTER TABLE ONLY public.parametros_sistema ALTER COLUMN parametro_id SET DEFAULT nextval('public.parametros_sistema_parametro_id_seq'::regclass);

ALTER TABLE ONLY public.permisos ALTER COLUMN permiso_id SET DEFAULT nextval('public.permisos_permiso_id_seq'::regclass);

ALTER TABLE ONLY public.programacion_turnos ALTER COLUMN turno_id SET DEFAULT nextval('public.programacion_turnos_turno_id_seq'::regclass);

ALTER TABLE ONLY public.reportes_generados ALTER COLUMN reporte_id SET DEFAULT nextval('public.reportes_generados_reporte_id_seq'::regclass);

ALTER TABLE ONLY public.roles ALTER COLUMN rol_id SET DEFAULT nextval('public.roles_rol_id_seq'::regclass);

ALTER TABLE ONLY public.signos_vitales_paciente ALTER COLUMN signo_id SET DEFAULT nextval('public.signos_vitales_paciente_signo_id_seq'::regclass);

ALTER TABLE ONLY public.vehiculo_cupones ALTER COLUMN registro_id SET DEFAULT nextval('public.vehiculo_cupones_registro_id_seq'::regclass);

ALTER TABLE ONLY public.vehiculo_cupones_periodos ALTER COLUMN periodo_id SET DEFAULT nextval('public.vehiculo_cupones_periodos_periodo_id_seq'::regclass);

ALTER TABLE ONLY public.vehiculo_mantenimientos ALTER COLUMN mantenimiento_id SET DEFAULT nextval('public.vehiculo_mantenimientos_mantenimiento_id_seq'::regclass);

ALTER TABLE ONLY public.vehiculos ALTER COLUMN vehiculo_id SET DEFAULT nextval('public.vehiculos_vehiculo_id_seq'::regclass);

ALTER TABLE ONLY public."__EFMigrationsHistory"
    ADD CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId");

ALTER TABLE ONLY public.bitacora_accesos
    ADD CONSTRAINT bitacora_accesos_pkey PRIMARY KEY (bitacora_id);

ALTER TABLE ONLY public.bitacora_cambios
    ADD CONSTRAINT bitacora_cambios_pkey PRIMARY KEY (cambio_id);

ALTER TABLE ONLY public.cat_categorias_inventario
    ADD CONSTRAINT cat_categorias_inventario_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.cat_categorias_inventario
    ADD CONSTRAINT cat_categorias_inventario_pkey PRIMARY KEY (categoria_inv_id);

ALTER TABLE ONLY public.cat_especialidades
    ADD CONSTRAINT cat_especialidades_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.cat_especialidades
    ADD CONSTRAINT cat_especialidades_pkey PRIMARY KEY (especialidad_id);

ALTER TABLE ONLY public.cat_estados_entrega
    ADD CONSTRAINT cat_estados_entrega_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.cat_estados_entrega
    ADD CONSTRAINT cat_estados_entrega_pkey PRIMARY KEY (estado_entrega_id);

ALTER TABLE ONLY public.cat_gasolineras
    ADD CONSTRAINT cat_gasolineras_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.cat_gasolineras
    ADD CONSTRAINT cat_gasolineras_pkey PRIMARY KEY (gasolinera_id);

ALTER TABLE ONLY public.cat_hospitales
    ADD CONSTRAINT cat_hospitales_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.cat_hospitales
    ADD CONSTRAINT cat_hospitales_pkey PRIMARY KEY (hospital_id);

ALTER TABLE ONLY public.cat_modulos
    ADD CONSTRAINT cat_modulos_codigo_key UNIQUE (codigo);

ALTER TABLE ONLY public.cat_modulos
    ADD CONSTRAINT cat_modulos_pkey PRIMARY KEY (modulo_id);

ALTER TABLE ONLY public.cat_proveedores
    ADD CONSTRAINT cat_proveedores_nombre_empresa_key UNIQUE (nombre_empresa);

ALTER TABLE ONLY public.cat_proveedores
    ADD CONSTRAINT cat_proveedores_pkey PRIMARY KEY (proveedor_id);

ALTER TABLE ONLY public.cat_rangos
    ADD CONSTRAINT cat_rangos_pkey PRIMARY KEY (rango_id);

ALTER TABLE ONLY public.cat_rangos
    ADD CONSTRAINT cat_rangos_rango_key UNIQUE (rango);

ALTER TABLE ONLY public.cat_roles_servicio
    ADD CONSTRAINT cat_roles_servicio_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.cat_roles_servicio
    ADD CONSTRAINT cat_roles_servicio_pkey PRIMARY KEY (rol_servicio_id);

ALTER TABLE ONLY public.cat_talleres
    ADD CONSTRAINT cat_talleres_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.cat_talleres
    ADD CONSTRAINT cat_talleres_pkey PRIMARY KEY (taller_id);

ALTER TABLE ONLY public.cat_tipos_asistencia
    ADD CONSTRAINT cat_tipos_asistencia_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.cat_tipos_asistencia
    ADD CONSTRAINT cat_tipos_asistencia_pkey PRIMARY KEY (tipo_asistencia_id);

ALTER TABLE ONLY public.cat_tipos_documento
    ADD CONSTRAINT cat_tipos_documento_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.cat_tipos_documento
    ADD CONSTRAINT cat_tipos_documento_pkey PRIMARY KEY (tipo_documento_id);

ALTER TABLE ONLY public.cat_tipos_emergencia
    ADD CONSTRAINT cat_tipos_emergencia_pkey PRIMARY KEY (tipo_emergencia_id);

ALTER TABLE ONLY public.cat_tipos_emergencia
    ADD CONSTRAINT cat_tipos_emergencia_tipo_key UNIQUE (tipo);

ALTER TABLE ONLY public.cat_tipos_mantenimiento
    ADD CONSTRAINT cat_tipos_mantenimiento_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.cat_tipos_mantenimiento
    ADD CONSTRAINT cat_tipos_mantenimiento_pkey PRIMARY KEY (tipo_mantenimiento_id);

ALTER TABLE ONLY public.cat_tipos_movimiento
    ADD CONSTRAINT cat_tipos_movimiento_codigo_key UNIQUE (codigo);

ALTER TABLE ONLY public.cat_tipos_movimiento
    ADD CONSTRAINT cat_tipos_movimiento_pkey PRIMARY KEY (tipo_mov_id);

ALTER TABLE ONLY public.cat_tipos_unidad
    ADD CONSTRAINT cat_tipos_unidad_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.cat_tipos_unidad
    ADD CONSTRAINT cat_tipos_unidad_pkey PRIMARY KEY (tipo_unidad_id);

ALTER TABLE ONLY public.cat_tipos_vehiculo
    ADD CONSTRAINT cat_tipos_vehiculo_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.cat_tipos_vehiculo
    ADD CONSTRAINT cat_tipos_vehiculo_pkey PRIMARY KEY (tipo_vehiculo_id);

ALTER TABLE ONLY public.cat_unidades
    ADD CONSTRAINT cat_unidades_codigo_unidad_key UNIQUE (codigo_unidad);

ALTER TABLE ONLY public.cat_unidades
    ADD CONSTRAINT cat_unidades_pkey PRIMARY KEY (unidad_id);

ALTER TABLE ONLY public.codigos_recuperacion
    ADD CONSTRAINT codigos_recuperacion_pkey PRIMARY KEY (codigo_id);

ALTER TABLE ONLY public.control_combustible
    ADD CONSTRAINT control_combustible_pkey PRIMARY KEY (combustible_id);

ALTER TABLE ONLY public.direcciones_personal
    ADD CONSTRAINT direcciones_personal_personal_id_key UNIQUE (personal_id);

ALTER TABLE ONLY public.direcciones_personal
    ADD CONSTRAINT direcciones_personal_pkey PRIMARY KEY (direccion_id);

ALTER TABLE ONLY public.donacion_libros
    ADD CONSTRAINT donacion_libros_anio_mes_key UNIQUE (anio, mes);

ALTER TABLE ONLY public.donacion_libros
    ADD CONSTRAINT donacion_libros_pkey PRIMARY KEY (libro_id);

ALTER TABLE ONLY public.donacion_movimientos
    ADD CONSTRAINT donacion_movimientos_pkey PRIMARY KEY (movimiento_id);

ALTER TABLE ONLY public.donaciones
    ADD CONSTRAINT donaciones_no_recibo_key UNIQUE (no_recibo);

ALTER TABLE ONLY public.donaciones
    ADD CONSTRAINT donaciones_pkey PRIMARY KEY (donacion_id);

ALTER TABLE ONLY public.emergencias_servicios
    ADD CONSTRAINT emergencias_servicios_numero_incidente_key UNIQUE (numero_incidente);

ALTER TABLE ONLY public.emergencias_servicios
    ADD CONSTRAINT emergencias_servicios_pkey PRIMARY KEY (servicio_id);

ALTER TABLE ONLY public.finanzas_transacciones
    ADD CONSTRAINT finanzas_transacciones_pkey PRIMARY KEY (transaccion_id);

ALTER TABLE ONLY public.hospital_contactos
    ADD CONSTRAINT hospital_contactos_pkey PRIMARY KEY (contacto_id);

ALTER TABLE ONLY public.inventario_items
    ADD CONSTRAINT inventario_items_pkey PRIMARY KEY (item_id);

ALTER TABLE ONLY public.inventario_movimientos
    ADD CONSTRAINT inventario_movimientos_pkey PRIMARY KEY (movimiento_id);

ALTER TABLE ONLY public.mantenimiento_unidades
    ADD CONSTRAINT mantenimiento_unidades_pkey PRIMARY KEY (mantenimiento_id);

ALTER TABLE ONLY public.materiales_donacion
    ADD CONSTRAINT materiales_donacion_pkey PRIMARY KEY (material_id);

ALTER TABLE ONLY public.novedades_estacion
    ADD CONSTRAINT novedades_estacion_pkey PRIMARY KEY (novedad_id);

ALTER TABLE ONLY public.parametros_sistema
    ADD CONSTRAINT parametros_sistema_clave_key UNIQUE (clave);

ALTER TABLE ONLY public.parametros_sistema
    ADD CONSTRAINT parametros_sistema_pkey PRIMARY KEY (parametro_id);

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_codigo_key UNIQUE (codigo);

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (permiso_id);

ALTER TABLE ONLY public.personal
    ADD CONSTRAINT personal_codigo_bombero_key UNIQUE (codigo_bombero);

ALTER TABLE ONLY public.personal
    ADD CONSTRAINT personal_dpi_key UNIQUE (dpi);

ALTER TABLE ONLY public.personal
    ADD CONSTRAINT personal_pkey PRIMARY KEY (personal_id);

ALTER TABLE ONLY public.equipo_unidades
    ADD CONSTRAINT pk_equipo_unidades PRIMARY KEY (unidad_id, item_id);

ALTER TABLE ONLY public.personal_especialidades
    ADD CONSTRAINT pk_personal_especialidad PRIMARY KEY (personal_id, especialidad_id);

ALTER TABLE ONLY public.rol_modulo
    ADD CONSTRAINT pk_rol_modulo PRIMARY KEY (rol_id, modulo_id);

ALTER TABLE ONLY public.rol_permisos
    ADD CONSTRAINT pk_rol_permisos PRIMARY KEY (rol_id, permiso_id);

ALTER TABLE ONLY public.servicio_tipos_asistencia
    ADD CONSTRAINT pk_servicio_asistencia PRIMARY KEY (servicio_id, tipo_asistencia);

ALTER TABLE ONLY public.servicio_insumos_utilizados
    ADD CONSTRAINT pk_servicio_insumos PRIMARY KEY (servicio_id, item_id);

ALTER TABLE ONLY public.servicio_personal_asignado
    ADD CONSTRAINT pk_servicio_personal PRIMARY KEY (servicio_id, nombre_personal);

ALTER TABLE ONLY public.usuario_modulos
    ADD CONSTRAINT pk_usuario_modulos PRIMARY KEY (usuario_id, modulo_id);

ALTER TABLE ONLY public.usuario_permisos
    ADD CONSTRAINT pk_usuario_permisos PRIMARY KEY (usuario_id, permiso_id);

ALTER TABLE ONLY public.usuario_roles
    ADD CONSTRAINT pk_usuario_roles PRIMARY KEY (usuario_id, rol_id);

ALTER TABLE ONLY public.programacion_turnos
    ADD CONSTRAINT programacion_turnos_pkey PRIMARY KEY (turno_id);

ALTER TABLE ONLY public.reportes_generados
    ADD CONSTRAINT reportes_generados_pkey PRIMARY KEY (reporte_id);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (rol_id);

ALTER TABLE ONLY public.sesiones_activas
    ADD CONSTRAINT sesiones_activas_pkey PRIMARY KEY (sesion_id);

ALTER TABLE ONLY public.signos_vitales_paciente
    ADD CONSTRAINT signos_vitales_paciente_pkey PRIMARY KEY (signo_id);

ALTER TABLE ONLY public.signos_vitales_paciente
    ADD CONSTRAINT signos_vitales_paciente_servicio_id_key UNIQUE (servicio_id);

ALTER TABLE ONLY public.programacion_turnos
    ADD CONSTRAINT uk_personal_fecha UNIQUE (personal_id, fecha_turno);

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_personal_id_key UNIQUE (personal_id);

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (usuario_id);

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);

ALTER TABLE ONLY public.vehiculo_cupones_periodos
    ADD CONSTRAINT vehiculo_cupones_periodos_anio_mes_key UNIQUE (anio, mes);

ALTER TABLE ONLY public.vehiculo_cupones_periodos
    ADD CONSTRAINT vehiculo_cupones_periodos_pkey PRIMARY KEY (periodo_id);

ALTER TABLE ONLY public.vehiculo_cupones
    ADD CONSTRAINT vehiculo_cupones_pkey PRIMARY KEY (registro_id);

ALTER TABLE ONLY public.vehiculo_mantenimientos
    ADD CONSTRAINT vehiculo_mantenimientos_pkey PRIMARY KEY (mantenimiento_id);

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_codigo_key UNIQUE (codigo);

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_pkey PRIMARY KEY (vehiculo_id);

CREATE INDEX IF NOT EXISTS idx_finanzas_origen ON public.finanzas_transacciones USING btree (modulo_origen, referencia_origen);

CREATE INDEX IF NOT EXISTS idx_finanzas_responsable ON public.finanzas_transacciones USING btree (responsable_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_finanzas_tipo_fecha ON public.finanzas_transacciones USING btree (tipo, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_inventario_codigo ON public.inventario_items USING btree (codigo_barras);

CREATE INDEX IF NOT EXISTS idx_inventario_nombre ON public.inventario_items USING btree (nombre);

CREATE INDEX IF NOT EXISTS idx_movimientos_item ON public.inventario_movimientos USING btree (item_id, fecha_hora);

CREATE INDEX IF NOT EXISTS idx_personal_codigo ON public.personal USING btree (codigo_bombero);

CREATE INDEX IF NOT EXISTS idx_personal_codigo_bombero ON public.personal USING btree (codigo_bombero);

CREATE INDEX IF NOT EXISTS idx_personal_dpi ON public.personal USING btree (dpi);

CREATE INDEX IF NOT EXISTS idx_personal_nombre ON public.personal USING btree (primer_apellido, primer_nombre);

CREATE INDEX IF NOT EXISTS idx_personal_search_trgm ON public.personal USING gin (search_text public.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_usuarios_username ON public.usuarios USING btree (username);

CREATE INDEX IF NOT EXISTS idx_vehiculo_cupones_activo ON public.vehiculo_cupones USING btree (activo);

CREATE INDEX IF NOT EXISTS ix_cupones_periodo ON public.vehiculo_cupones USING btree (periodo_id, fecha, registro_id);

CREATE INDEX IF NOT EXISTS ix_cupones_periodo_fecha_comision ON public.vehiculo_cupones USING btree (periodo_id, fecha, comision_no, registro_id);

CREATE INDEX IF NOT EXISTS ix_cupones_vehiculo ON public.vehiculo_cupones USING btree (vehiculo_id);

CREATE INDEX IF NOT EXISTS ix_emergencias_vehiculo_estado ON public.emergencias_servicios USING btree (vehiculo_id, estado);

CREATE INDEX IF NOT EXISTS ix_mantenimientos_vehiculo ON public.vehiculo_mantenimientos USING btree (vehiculo_id, fecha_ingreso DESC);

CREATE INDEX IF NOT EXISTS ix_movimientos_donacion ON public.donacion_movimientos USING btree (donacion_id);

CREATE INDEX IF NOT EXISTS ix_movimientos_libro ON public.donacion_movimientos USING btree (libro_id, fecha, movimiento_id);

CREATE INDEX IF NOT EXISTS ix_movimientos_vehiculo ON public.donacion_movimientos USING btree (vehiculo_id);

CREATE INDEX IF NOT EXISTS ix_vehiculos_codigo ON public.vehiculos USING btree (codigo);

CREATE INDEX IF NOT EXISTS ix_vehiculos_estado ON public.vehiculos USING btree (estado, estado_operativo);

CREATE INDEX IF NOT EXISTS ix_vehiculos_placa ON public.vehiculos USING btree (placa);

CREATE UNIQUE INDEX IF NOT EXISTS uq_finanzas_origen ON public.finanzas_transacciones USING btree (modulo_origen, referencia_origen, tipo) WHERE ((modulo_origen IS NOT NULL) AND (referencia_origen IS NOT NULL));

CREATE UNIQUE INDEX IF NOT EXISTS ux_inventario_items_vehiculo ON public.inventario_items USING btree (vehiculo_id) WHERE (vehiculo_id IS NOT NULL);

ALTER TABLE ONLY public.donacion_movimientos
    ADD CONSTRAINT donacion_movimientos_donacion_id_fkey FOREIGN KEY (donacion_id) REFERENCES public.donaciones(donacion_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.donacion_movimientos
    ADD CONSTRAINT donacion_movimientos_libro_id_fkey FOREIGN KEY (libro_id) REFERENCES public.donacion_libros(libro_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.donacion_movimientos
    ADD CONSTRAINT donacion_movimientos_tipo_documento_id_fkey FOREIGN KEY (tipo_documento_id) REFERENCES public.cat_tipos_documento(tipo_documento_id);

ALTER TABLE ONLY public.donacion_movimientos
    ADD CONSTRAINT donacion_movimientos_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(vehiculo_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.emergencias_servicios
    ADD CONSTRAINT emergencias_servicios_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(vehiculo_id);

ALTER TABLE ONLY public.finanzas_transacciones
    ADD CONSTRAINT finanzas_transacciones_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES public.usuarios(usuario_id);

ALTER TABLE ONLY public.bitacora_cambios
    ADD CONSTRAINT fk_bitacora_cambios_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(usuario_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.bitacora_accesos
    ADD CONSTRAINT fk_bitacora_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(usuario_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.codigos_recuperacion
    ADD CONSTRAINT fk_codigos_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(usuario_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.control_combustible
    ADD CONSTRAINT fk_comb_conductor FOREIGN KEY (conductor_id) REFERENCES public.personal(personal_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.control_combustible
    ADD CONSTRAINT fk_comb_unidad FOREIGN KEY (unidad_id) REFERENCES public.cat_unidades(unidad_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.direcciones_personal
    ADD CONSTRAINT fk_dir_personal FOREIGN KEY (personal_id) REFERENCES public.personal(personal_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.equipo_unidades
    ADD CONSTRAINT fk_equ_item FOREIGN KEY (item_id) REFERENCES public.inventario_items(item_id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.equipo_unidades
    ADD CONSTRAINT fk_equ_unidad FOREIGN KEY (unidad_id) REFERENCES public.cat_unidades(unidad_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.hospital_contactos
    ADD CONSTRAINT fk_hc_hospital FOREIGN KEY (hospital_id) REFERENCES public.cat_hospitales(hospital_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.inventario_items
    ADD CONSTRAINT fk_item_categoria FOREIGN KEY (categoria_inv_id) REFERENCES public.cat_categorias_inventario(categoria_inv_id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.inventario_items
    ADD CONSTRAINT fk_item_proveedor FOREIGN KEY (proveedor_id) REFERENCES public.cat_proveedores(proveedor_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.mantenimiento_unidades
    ADD CONSTRAINT fk_mant_taller FOREIGN KEY (taller_id) REFERENCES public.cat_talleres(taller_id);

ALTER TABLE ONLY public.mantenimiento_unidades
    ADD CONSTRAINT fk_mant_tipo FOREIGN KEY (tipo_mantenimiento_id) REFERENCES public.cat_tipos_mantenimiento(tipo_mantenimiento_id);

ALTER TABLE ONLY public.mantenimiento_unidades
    ADD CONSTRAINT fk_mant_unidad FOREIGN KEY (unidad_id) REFERENCES public.cat_unidades(unidad_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.inventario_movimientos
    ADD CONSTRAINT fk_mov_item FOREIGN KEY (item_id) REFERENCES public.inventario_items(item_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.inventario_movimientos
    ADD CONSTRAINT fk_mov_responsable FOREIGN KEY (responsable_id) REFERENCES public.personal(personal_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.inventario_movimientos
    ADD CONSTRAINT fk_mov_tipo FOREIGN KEY (tipo_mov_id) REFERENCES public.cat_tipos_movimiento(tipo_mov_id);

ALTER TABLE ONLY public.novedades_estacion
    ADD CONSTRAINT fk_novedades_usuario FOREIGN KEY (registrado_por_id) REFERENCES public.usuarios(usuario_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.personal_especialidades
    ADD CONSTRAINT fk_pe_especialidad FOREIGN KEY (especialidad_id) REFERENCES public.cat_especialidades(especialidad_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.personal_especialidades
    ADD CONSTRAINT fk_pe_personal FOREIGN KEY (personal_id) REFERENCES public.personal(personal_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT fk_permiso_modulo FOREIGN KEY (modulo_id) REFERENCES public.cat_modulos(modulo_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.personal
    ADD CONSTRAINT fk_personal_rango FOREIGN KEY (rango_id) REFERENCES public.cat_rangos(rango_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.reportes_generados
    ADD CONSTRAINT fk_rep_usuario FOREIGN KEY (generado_por_id) REFERENCES public.usuarios(usuario_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.rol_permisos
    ADD CONSTRAINT fk_rp_permiso FOREIGN KEY (permiso_id) REFERENCES public.permisos(permiso_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.rol_permisos
    ADD CONSTRAINT fk_rp_rol FOREIGN KEY (rol_id) REFERENCES public.roles(rol_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.emergencias_servicios
    ADD CONSTRAINT fk_servicios_formulador FOREIGN KEY (formulado_por_id) REFERENCES public.personal(personal_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.emergencias_servicios
    ADD CONSTRAINT fk_servicios_hospital FOREIGN KEY (hospital_destino_id) REFERENCES public.cat_hospitales(hospital_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.emergencias_servicios
    ADD CONSTRAINT fk_servicios_tipo FOREIGN KEY (tipo_emergencia_id) REFERENCES public.cat_tipos_emergencia(tipo_emergencia_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.emergencias_servicios
    ADD CONSTRAINT fk_servicios_unidad FOREIGN KEY (unidad_asignada_id) REFERENCES public.cat_unidades(unidad_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.sesiones_activas
    ADD CONSTRAINT fk_sesiones_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(usuario_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.servicio_insumos_utilizados
    ADD CONSTRAINT fk_siu_item FOREIGN KEY (item_id) REFERENCES public.inventario_items(item_id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.servicio_insumos_utilizados
    ADD CONSTRAINT fk_siu_servicio FOREIGN KEY (servicio_id) REFERENCES public.emergencias_servicios(servicio_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.servicio_personal_asignado
    ADD CONSTRAINT fk_spa_personal FOREIGN KEY (personal_id) REFERENCES public.personal(personal_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.servicio_personal_asignado
    ADD CONSTRAINT fk_spa_rol FOREIGN KEY (rol_servicio_id) REFERENCES public.cat_roles_servicio(rol_servicio_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.servicio_personal_asignado
    ADD CONSTRAINT fk_spa_rol_servicio FOREIGN KEY (rol_servicio_id) REFERENCES public.cat_roles_servicio(rol_servicio_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.servicio_personal_asignado
    ADD CONSTRAINT fk_spa_servicio FOREIGN KEY (servicio_id) REFERENCES public.emergencias_servicios(servicio_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.servicio_tipos_asistencia
    ADD CONSTRAINT fk_sta_servicio FOREIGN KEY (servicio_id) REFERENCES public.emergencias_servicios(servicio_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.signos_vitales_paciente
    ADD CONSTRAINT fk_svp_servicio FOREIGN KEY (servicio_id) REFERENCES public.emergencias_servicios(servicio_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.programacion_turnos
    ADD CONSTRAINT fk_turno_personal FOREIGN KEY (personal_id) REFERENCES public.personal(personal_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.cat_unidades
    ADD CONSTRAINT fk_unidad_tipo FOREIGN KEY (tipo_unidad_id) REFERENCES public.cat_tipos_unidad(tipo_unidad_id);

ALTER TABLE ONLY public.usuario_roles
    ADD CONSTRAINT fk_usuario_roles_rol FOREIGN KEY (rol_id) REFERENCES public.roles(rol_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.usuario_roles
    ADD CONSTRAINT fk_usuario_roles_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(usuario_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuarios_personal FOREIGN KEY (personal_id) REFERENCES public.personal(personal_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.inventario_items
    ADD CONSTRAINT inventario_items_donacion_id_fkey FOREIGN KEY (donacion_id) REFERENCES public.donaciones(donacion_id);

ALTER TABLE ONLY public.inventario_items
    ADD CONSTRAINT inventario_items_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(vehiculo_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.materiales_donacion
    ADD CONSTRAINT materiales_donacion_donacion_id_fkey FOREIGN KEY (donacion_id) REFERENCES public.donaciones(donacion_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.rol_modulo
    ADD CONSTRAINT rol_modulo_modulo_id_fkey FOREIGN KEY (modulo_id) REFERENCES public.cat_modulos(modulo_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.rol_modulo
    ADD CONSTRAINT rol_modulo_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(rol_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.usuario_modulos
    ADD CONSTRAINT usuario_modulos_modulo_id_fkey FOREIGN KEY (modulo_id) REFERENCES public.cat_modulos(modulo_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.usuario_modulos
    ADD CONSTRAINT usuario_modulos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(usuario_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.usuario_permisos
    ADD CONSTRAINT usuario_permisos_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permisos(permiso_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.usuario_permisos
    ADD CONSTRAINT usuario_permisos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(usuario_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.vehiculo_cupones
    ADD CONSTRAINT vehiculo_cupones_gasolinera_id_fkey FOREIGN KEY (gasolinera_id) REFERENCES public.cat_gasolineras(gasolinera_id);

ALTER TABLE ONLY public.vehiculo_cupones
    ADD CONSTRAINT vehiculo_cupones_periodo_id_fkey FOREIGN KEY (periodo_id) REFERENCES public.vehiculo_cupones_periodos(periodo_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.vehiculo_cupones
    ADD CONSTRAINT vehiculo_cupones_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(vehiculo_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.vehiculo_mantenimientos
    ADD CONSTRAINT vehiculo_mantenimientos_taller_id_fkey FOREIGN KEY (taller_id) REFERENCES public.cat_talleres(taller_id);

ALTER TABLE ONLY public.vehiculo_mantenimientos
    ADD CONSTRAINT vehiculo_mantenimientos_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(vehiculo_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_donacion_id_fkey FOREIGN KEY (donacion_id) REFERENCES public.donaciones(donacion_id) ON DELETE SET NULL;

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_tipo_id_fkey FOREIGN KEY (tipo_id) REFERENCES public.cat_tipos_vehiculo(tipo_vehiculo_id);

-- ============================================================================
-- DATOS MÍNIMOS INDISPENSABLES (sin datos de prueba)
-- ============================================================================

SET search_path = public;

INSERT INTO public.roles (rol_id, nombre, descripcion)
VALUES
    (1, 'admin',      'Administrador del sistema'),
    (2, 'voluntario', 'Voluntario'),
    (3, 'secretario', 'Secretario')
ON CONFLICT DO NOTHING;

INSERT INTO public.usuarios (usuario_id, username, password_hash, estado, debe_cambiar_contrasena)
VALUES (
    gen_random_uuid(),
    'admin',
    '$2a$11$KJxIr7tfjjZoFrJgvMES3.W0Tuvk9GDcdLPEPKCF8SaZUmK3fbs0a',
    TRUE,
    TRUE
)
ON CONFLICT DO NOTHING;

INSERT INTO public.usuario_roles (usuario_id, rol_id)
SELECT u.usuario_id, 1
FROM public.usuarios u
WHERE u.username = 'admin'
ON CONFLICT DO NOTHING;

-- Sincronizar la secuencia de roles con los ids insertados
SELECT setval('public.roles_rol_id_seq', (SELECT COALESCE(MAX(rol_id), 1) FROM public.roles), true);

COMMIT;
