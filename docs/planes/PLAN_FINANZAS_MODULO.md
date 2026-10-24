# Plan Implementación Módulo Finanzas - Auto-registro Mantenimiento/Donaciones

## Objetivo
Módulo Finanzas completo con auto-registro desde Mantenimiento (Gasto) y Donaciones (Ingreso), UI consistente con alertas/validaciones globales, responsable con nombre completo.

---

## 1. Modelo BD - Nueva Tabla

```sql
-- migracion_finanzas.sql
CREATE TABLE finanzas_transacciones (
    transaccion_id      BIGSERIAL PRIMARY KEY,
    tipo                VARCHAR(20) NOT NULL CHECK (tipo IN ('INGRESO','GASTO','DONACION')),
    descripcion         VARCHAR(500) NOT NULL,
    monto               NUMERIC(14,2) NOT NULL CHECK (monto > 0),
    fecha               DATE NOT NULL DEFAULT CURRENT_DATE,
    referencia          VARCHAR(100),
    responsable_id      UUID NOT NULL REFERENCES usuarios(usuario_id),
    responsable_nombre  VARCHAR(200) NOT NULL,  -- "Juan Carlos Pérez González"
    modulo_origen       VARCHAR(50),            -- 'MANTENIMIENTO', 'DONACIONES', 'MANUAL'
    referencia_origen   VARCHAR(100),           -- ID mantenimiento/donación origen
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_finanzas_tipo_fecha ON finanzas_transacciones(tipo, fecha DESC);
CREATE INDEX idx_finanzas_responsable ON finanzas_transacciones(responsable_id, fecha DESC);
CREATE INDEX idx_finanzas_origen ON finanzas_transacciones(modulo_origen, referencia_origen);
```

---

## 2. Backend - Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `Backend_Sub33/Backend_Sub33/DTOs/Finanzas/FinanzasDtos.cs` | **NUEVO** DTOs: `TransaccionDto`, `TransaccionCreateDto`, `TransaccionUpdateDto`, `TransaccionFiltrosDto`, `ResumenFinancieroDto` |
| `Backend_Sub33/Backend_Sub33/Models/Entities/FinanzaTransaccion.cs` | **NUEVO** Entidad BD |
| `Backend_Sub33/Backend_Sub33/Services/IFinanzasService.cs` | **NUEVO** Interface |
| `Backend_Sub33/Backend_Sub33/Services/FinanzasService.cs` | **NUEVO** Lógica + métodos `crearGastoDesdeMantenimiento()`, `crearIngresoDesdeDonacion()` |
| `Backend_Sub33/Backend_Sub33/Controllers/FinanzasController.cs` | **NUEVO** Endpoints REST |
| `Backend_Sub33/Backend_Sub33/Data/SQL/migracion_finanzas.sql` | **NUEVO** Migración BD |
| `Backend_Sub33/Backend_Sub33/Services/MantenimientoService.cs` | **MODIFICAR** - Al finalizar mantenimiento → `finanzasService.crearGastoDesdeMantenimiento()` |
| `Backend_Sub33/Backend_Sub33/Services/DonacionService.cs` | **MODIFICAR** - Al registrar donación monetaria → `finanzasService.crearIngresoDesdeDonacion()` |

### DTOs (FinanzasDtos.cs)
```csharp
public class TransaccionDto {
    public long TransaccionId { get; set; }
    public string Tipo { get; set; } // INGRESO, GASTO, DONACION
    public string Descripcion { get; set; }
    public decimal Monto { get; set; }
    public DateTime Fecha { get; set; }
    public string Referencia { get; set; }
    public Guid ResponsableId { get; set; }
    public string ResponsableNombre { get; set; }
    public string ModuloOrigen { get; set; }
    public string ReferenciaOrigen { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TransaccionCreateDto {
    public string Tipo { get; set; } // INGRESO, GASTO, DONACION
    public string Descripcion { get; set; }
    public decimal Monto { get; set; }
    public DateTime? Fecha { get; set; }
    public string Referencia { get; set; }
    public string ModuloOrigen { get; set; }
    public string ReferenciaOrigen { get; set; }
}

public class ResumenFinancieroDto {
    public decimal TotalIngresos { get; set; }
    public decimal TotalGastos { get; set; }
    public decimal TotalDonaciones { get; set; }
    public decimal Balance { get; set; }
}
```

### FinanzasService.cs - Métodos clave
```csharp
public async Task<ServiceResult<TransaccionDto>> CrearTransaccionAsync(TransaccionCreateDto dto, string responsableNombre, Guid responsableId)
public async Task<ServiceResult<TransaccionDto>> CrearGastoDesdeMantenimientoAsync(int mantenimientoId, decimal costo, string descripcion, Guid responsableId, string responsableNombre)
public async Task<ServiceResult<TransaccionDto>> CrearIngresoDesdeDonacionAsync(int donacionId, decimal monto, string descripcion, Guid responsableId, string responsableNombre)
public async Task<ServiceResult<ResumenFinancieroDto>> ObtenerResumenAsync(DateTime? desde, DateTime? hasta)
public async Task<ServiceResult<PaginatedResult<TransaccionDto>>> ListarAsync(TransaccionFiltrosDto filtros)
```

---

## 3. Frontend - Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/types/finanzas.ts` | **NUEVO** Tipos TS |
| `src/services/finanzasService.ts` | **NUEVO** API client |
| `src/hooks/useFinanzas.ts` | **NUEVO** Hook React |
| `src/app/pages/Finanzas/FinanzasPage.tsx` | **REFACTOR** - DataTable + KPIs + Filtros + Modal |
| `src/app/pages/Finanzas/components/TransaccionModal.tsx` | **NUEVO** Modal "Nueva Transacción" |
| `src/app/pages/Finanzas/components/FinanzasKpiBar.tsx` | **NUEVO** KPIs: Ingresos/Gastos/Donaciones/Balance |
| `src/app/pages/Finanzas/components/FinanzasFilters.tsx` | **NUEVO** Filtros Tipo/Fecha/Responsable |
| `src/app/pages/Finanzas/components/TransaccionModal.tsx` | **NUEVO** Modal "Nueva Transacción" |
| `src/app/pages/Vehiculos/components/MantenimientoModal.tsx` | **MODIFICAR** - Llamar `finanzasService.crearGastoDesdeMantenimiento()` al finalizar |
| `src/app/pages/Donaciones/DonacionesPage.tsx` | **MODIFICAR** - Llamar `crearIngresoDesdeDonacion()` al registrar donación monetaria |
| `src/services/finanzasService.ts` | **NUEVO** API client + métodos `crearGastoDesdeMantenimiento()`, `crearIngresoDesdeDonacion()` |
| `src/hooks/useFinanzas.ts` | **NUEVO** Hook React |
| `src/types/finanzas.ts` | **NUEVO** Tipos TS |

### Tipos TypeScript (finanzas.ts)
```typescript
export type TipoTransaccion = 'INGRESO' | 'GASTO' | 'DONACION';

export interface Transaccion {
  transaccionId: number;
  tipo: TipoTransaccion;
  descripcion: string;
  monto: number;
  fecha: string;
  referencia?: string;
  responsableId: string;
  responsableNombre: string;
  moduloOrigen?: string;
  referenciaOrigen?: string;
  createdAt: string;
}

export interface TransaccionCreate {
  tipo: TipoTransaccion;
  descripcion: string;
  monto: number;
  fecha?: string;
  referencia?: string;
  moduloOrigen?: string;
  referenciaOrigen?: string;
}

export interface ResumenFinanciero {
  totalIngresos: number;
  totalGastos: number;
  totalDonaciones: number;
  balance: number;
}

export interface TransaccionFiltros {
  tipo?: TipoTransaccion;
  fechaDesde?: string;
  fechaHasta?: string;
  responsableId?: string;
  pagina: number;
  tamanio: number;
}
```

### FinanzasPage.tsx - Estructura
- **KPI Bar**: Total Ingresos | Total Gastos | Total Donaciones | Balance
- **Filtros**: Tipo (select) + Fecha (range) + Responsable (select) + Buscar
- **DataTable**: Tipo | Descripción | Monto | Responsable (nombre completo) | Fecha | Referencia | Acciones
- **Modal "Nueva Transacción"**: Tipo (select) | Descripción | Monto | Fecha | Referencia
- **Auto-refresh** tras crear/editar/eliminar

---

## 4. Integración Auto-Registro

### MantenimientoModal.tsx (al finalizar)
```typescript
// En handleFinalizar, después de guardar mantenimiento:
if (costo && costo > 0) {
  await finanzasService.crearGastoDesdeMantenimiento(
    mantenimiento.mantenimientoId,
    costo,
    `Mantenimiento #${mantenimiento.mantenimientoId} - ${vehiculo?.marca} ${vehiculo?.modelo}`,
    user?.personalId,
    user?.name // "Juan Carlos Pérez González"
  );
}
```

### DonacionesPage.tsx (al registrar donación monetaria)
```typescript
// En handleCrearDonacion, si tipo === 'MONETARIA':
await finanzasService.crearIngresoDesdeDonacion(
  donacion.donacionId,
  donacion.monto,
  `Donación ${donacion.tipo} - ${donacion.donante}`,
  user?.personalId,
  user?.name
);
```

---

## 5. Consistencia UI/UX Global (Aplicar a TODOS los módulos)

| Aspecto | Implementación |
|---------|----------------|
| **Alertas** | `useAlert()` → `toast.success/error/warning/info`, `alert.confirm` |
| **Modales** | Componente `Modal` (Radix) - Header/Body/Footer, loading en submit |
| **Validación campos** | Required → border rojo + toast.error • Solo números → `type=number` + validación JS |
| **Duplicados** | Validación async + toast.warning |
| **Campos requeridos** | Border rojo + tooltip + toast.error "Campo X obligatorio" |
| **Solo números** | `type="number"` + `onChange` filtra no numéricos + toast.warning |
| **Duplicados** | Validación async en onBlur → toast.warning "Ya existe" |
| **Loading** | Spinner en botón submit + disabled |
| **Feedback** | toast.success "Guardado" / toast.error "Error: mensaje" |

### Hook de validación reutilizable (crear `src/hooks/useFormValidation.ts`)
```typescript
export function useFormValidation<T>(initialValues: T, rules: ValidationRules<T>) {
  // Retorna: values, errors, handleChange, handleBlur, validateAll, isValid
}
```

---

## 5. Tests

| Archivo | Qué testea |
|---------|------------|
| `src/__tests__/finanzas.test.ts` | Unitarios: cálculos, validaciones, formateo |
| `src/__tests__/finanzas.integration.test.tsx` | Integración: auto-registro Mantenimiento→Gasto, Donaciones→Ingreso |

---

## 6. Migración BD

```sql
-- Backend_Sub33/Backend_Sub33/Data/SQL/migracion_finanzas.sql
CREATE TABLE finanzas_transacciones (...);
-- Índices incluidos
```

---

## Verificación Obligatoria

```bash
npm run build && npm test && dotnet build && dotnet test
# 0 errors, 42+ tests passing
psql -f Backend_Sub33/Backend_Sub33/Data/SQL/migracion_finanzas.sql
# Verificar: INSERT automático al finalizar mantenimiento / registrar donación
# Verificar: DataTable filtros, KPIs, export CSV
```

---

## Prompt para IA de Pago

```markdown
Implementa módulo **Finanzas** completo con auto-registro desde Mantenimiento (Gasto) y Donaciones (Ingreso).

## Entregables:
1. **Backend**: Entidad + DTOs + Service + Controller + Migración BD + Auto-registro (Mantenimiento→Gasto, Donaciones→Ingreso)
2. **Frontend**: FinanzasPage (DataTable + KPIs + Filtros + Modal Transacción) + Hook useFinanzas + Service + Types
3. **Integración**: MantenimientoModal → crearGastoDesdeMantenimiento() | DonacionesPage → crearIngresoDesdeDonacion()
4. **UI Consistente**: Mismos alertas (useAlert), modales, validaciones que resto de módulos
5. **Tests**: Unitarios + Integración (auto-registro)

## Verificación:
npm run build && npm test && dotnet build && dotnet test = 0 errors, tests passing
psql -f Backend_Sub33/Backend_Sub33/Data/SQL/migracion_finanzas.sql

No dejes servers corriendo. Actualiza CONTEXTO.md al final.
```