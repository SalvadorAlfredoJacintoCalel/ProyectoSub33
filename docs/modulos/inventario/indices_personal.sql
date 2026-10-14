-- Índices para búsqueda typeahead en Personal
CREATE INDEX IF NOT EXISTS idx_personal_nombre ON personal (primer_apellido, primer_nombre);
CREATE INDEX IF NOT EXISTS idx_personal_dpi ON personal (dpi);
CREATE INDEX IF NOT EXISTS idx_personal_codigo ON personal (codigo_bombero);
