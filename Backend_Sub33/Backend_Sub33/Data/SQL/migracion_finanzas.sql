-- ============================================================================
-- Módulo Finanzas — tabla de transacciones financieras
-- Idempotente: se puede ejecutar varias veces sin error.
-- Auto-registro: Mantenimiento -> GASTO, Donaciones -> DONACION.
-- ============================================================================

CREATE TABLE IF NOT EXISTS finanzas_transacciones (
    transaccion_id      BIGSERIAL PRIMARY KEY,
    tipo                VARCHAR(20) NOT NULL CHECK (tipo IN ('INGRESO','GASTO','DONACION')),
    descripcion         VARCHAR(500) NOT NULL,
    monto               NUMERIC(14,2) NOT NULL CHECK (monto > 0),
    fecha               DATE NOT NULL DEFAULT CURRENT_DATE,
    referencia          VARCHAR(100),
    responsable_id      UUID NOT NULL REFERENCES usuarios(usuario_id),
    responsable_nombre  VARCHAR(200) NOT NULL,
    modulo_origen       VARCHAR(50),
    referencia_origen   VARCHAR(100),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finanzas_tipo_fecha ON finanzas_transacciones(tipo, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_finanzas_responsable ON finanzas_transacciones(responsable_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_finanzas_origen ON finanzas_transacciones(modulo_origen, referencia_origen);

-- Evita auto-registros duplicados (un gasto por mantenimiento, un ingreso por donación).
CREATE UNIQUE INDEX IF NOT EXISTS uq_finanzas_origen ON finanzas_transacciones(modulo_origen, referencia_origen, tipo)
WHERE modulo_origen IS NOT NULL AND referencia_origen IS NOT NULL;
