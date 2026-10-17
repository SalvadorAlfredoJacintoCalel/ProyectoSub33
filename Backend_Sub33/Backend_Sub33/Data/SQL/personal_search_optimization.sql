-- ============================================================================
-- Optimización de búsqueda de Personal
--   * pg_trgm + unaccent
--   * columna generada search_text (nombres + apellidos + codigo_bombero + dpi,
--     normalizada con unaccent(lower(...)))
--   * índice GIN trigram para búsquedas ILIKE '%texto%'
--
-- Idempotente: puede ejecutarse varias veces sin error.
-- Aplicar:
--   $env:PGPASSWORD='12345678'
--   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -d Sub_33 -f personal_search_optimization.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- unaccent() de una sola arg depende del search_path y no es IMMUTABLE, por lo
-- que no puede usarse en una columna generada. El wrapper de dos argumentos sí
-- es IMMUTABLE y permite indexar.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
    SELECT public.unaccent('public.unaccent', $1)
$$;

-- La expresión de una columna generada no puede modificarse con ALTER, por lo
-- que se recrea (y con ella su índice) para reflejar siempre la definición
-- vigente. Incluye: nombres, apellidos, código de bombero, DPI y teléfono.
ALTER TABLE personal DROP COLUMN IF EXISTS search_text;

ALTER TABLE personal
    ADD COLUMN search_text text
    GENERATED ALWAYS AS (
        public.immutable_unaccent(lower(
            coalesce(primer_nombre, '') || ' ' ||
            coalesce(segundo_nombre, '') || ' ' ||
            coalesce(primer_apellido, '') || ' ' ||
            coalesce(segundo_apellido, '') || ' ' ||
            coalesce(codigo_bombero, '') || ' ' ||
            coalesce(dpi, '') || ' ' ||
            coalesce(telefono, '')
        ))
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_personal_search_trgm
    ON personal USING gin (search_text gin_trgm_ops);
