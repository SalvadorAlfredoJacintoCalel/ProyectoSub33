# Plan de Mejoras — Módulo Vehículos (Drawer + Historial + Estado Operativo)

> Fecha: **2026-10-20**
> Objetivo: eliminar duplicidad de acciones de mantenimiento entre Flota e Historial, dar estructura de pestañas al Drawer (patrón de otros módulos) y agregar cambio rápido de estado operativo.

---

## Contexto del problema

- El `MantenimientoModal` se usa desde **dos rutas paralelas** (Drawer de Flota y tabla de Historial), duplicando crear / editar / finalizar / imprimir.
- El Drawer es una sola vista larga (Identificación, Valor, Mantenimientos, Cupones) sin pestañas, a diferencia de Inventario/Personal que usan `Tabs`.
- No existe endpoint para cambiar `estadoOperativo` rápidamente (solo `PUT` completo o recálculo automático por mantenimientos).
- Regla UX del proyecto: los KPIs de Vehículos NO abren modales; se mantiene.

## Decisiones del usuario

1. Drawer con **3 pestañas**: Info, Mantenimientos, Cupones.
2. Conflicto estado-operativo vs mantenimiento `En proceso`: **bloquear con advertencia**.
3. Historial conserva acciones **Imprimir + Eliminar**; se quita crear/editar/finalizar.
4. Historial mantiene **selector de vehículo** (no vista global).
5. Control de cambio de estado operativo en **pestaña Info, bloque "Estado operativo"**.

---

## Fase 1 — Drawer con 3 pestañas

**Archivo:** `src/app/pages/Vehiculos/components/VehiculoDrawer.tsx`

1. Importar `Tabs`, `TabItem` desde `@/app/components/ui/tabs`.
2. Construir `detailTabs: TabItem[]` cuando `vehiculo` no sea null:
   - `info` — label "Info", icono `Info`: secciones actuales *Identificación* (líneas 74-92) y *Valor e inventario* (líneas 94-111) + **bloque "Estado operativo"** (Fase 2).
   - `mantenimientos` — label "Mantenimientos", icono `Wrench`: sección actual (líneas 113-207) con acciones Registrar / Completar-finalizar / Imprimir.
   - `cupones` — label "Cupones", icono `Ticket`: sección actual de cupones recientes (líneas 209-240).
3. Render dentro del `Drawer`: `{vehiculo && <Tabs variant="glass" tabs={detailTabs} />}` **sin `value`/`onChange`** (reset a "Info" al abrir por desmontaje del portal).
4. Se conservan `footer` (Editar + Dar de baja/Reactivar) y `statusBadge` (3 badges).

## Fase 2 — Cambio rápido de estado operativo

### Backend

**Archivos:**
- `Backend_Sub33/Backend_Sub33/DTOs/Vehiculos/VehiculoDtos.cs` — agregar `VehiculoEstadoOperativoDto { string EstadoOperativo }`.
- `Backend_Sub33/Backend_Sub33/Services/IVehiculoService.cs` — `Task<ServiceResult<VehiculoDto>> ChangeEstadoOperativoAsync(int id, string estadoOperativo)`.
- `Backend_Sub33/Backend_Sub33/Services/VehiculoService.cs` — implementar:
  1. Validar contra `EstadosOperativos` (`"Operativa"`, `"En Servicio"`, `"Mantenimiento"`, `"Fuera de Servicio"`, case-insensitive).
  2. **Bloqueo:** consultar si existe mantenimiento `estado = 'En proceso'` para el vehículo; si existe y el estado nuevo ≠ `"Mantenimiento"` → `BadRequest` "Hay un mantenimiento en proceso; finalízalo antes de cambiar el estado operativo."
  3. `UPDATE vehiculos SET estado_operativo = @Estado, updated_at = CURRENT_TIMESTAMP WHERE vehiculo_id = @Id`.
  4. Devolver `GetByIdAsync(id)` en éxito; `NotFound` si no existe.
- `Backend_Sub33/Backend_Sub33/Controllers/VehiculosController.cs` — `PATCH {id:int}/estado-operativo` con `[FromBody] VehiculoEstadoOperativoDto`, respondiendo "Estado operativo actualizado correctamente.".

### Frontend

**Archivos:**
- `src/services/vehiculosService.ts` — `cambiarEstadoOperativo(id: number, estadoOperativo: EstadoOperativo)` → `apiClient.patch(`${API_BASE}/${id}/estado-operativo`, { estadoOperativo })`.
- `src/app/pages/Vehiculos/VehiculosPage.tsx` — handler `cambiarEstadoOperativoRapido(v, nuevoEstado)`:
  1. `alert.confirm(...)` antes de aplicar.
  2. Llamar servicio; manejar error (mostrar `message` del backend en toast/alert si es 400).
  3. Actualizar `detalle` local (merge del vehículo devuelto) + `cargarStats()`.
- `src/app/pages/Vehiculos/components/VehiculoDrawer.tsx` — en pestaña Info, bloque "Estado operativo":
  - Título de sección con el mismo estilo (`h3 uppercase`).
  - 4 opciones clicables (pills/botones tipo radio visual) usando `ESTADOS_OPERATIVOS` o lista importada.
  - Estado actual resaltado; al clicar otro → `onCambioEstadoOperativo(v, nuevo)` hacia la página.
  - Opcional: deshabilitar visualmente las que no sean permitidas si hay mant. en proceso (el backend igual bloquea).

## Fase 3 — Historial como DataTable sin duplicidad

**Archivo nuevo:** `src/app/pages/Vehiculos/components/MantenimientoTab.tsx`
(Extraer el componente local `MantenimientoPanel` de `VehiculosPage.tsx` líneas 622-870 y adaptarlo.)

1. Props: `{ onChanged: () => void; onImprimir: (v: Vehiculo, m: VehiculoMantenimiento) => void; onEliminar: (vehiculoId: number, m: VehiculoMantenimiento) => Promise<void> }` (o las que se necesiten; la página inyecta impresión y eliminación).
2. Se mantiene: `SelectField` de vehículo, pills de resumen (Registros, Costo total, Último servicio, En proceso), fetch con `cargarMantenimientos`.
3. **Se quita:** botón "Nueva hoja" (barra y empty state); acciones de editar/finalizar por fila.
4. Reemplazar `<table>` por `<DataTable>` de `@/app/components/ui/data-table`:
   - `columns`: Ingreso, Retorno, Tipo, Taller, Kilometraje, Costo, Estado (Badge), Observaciones, Acciones.
   - `getRowKey={(m) => m.mantenimientoId}`.
   - Paginación client-side (`pageSize` 10, `pageSizeOptions`), `zebra`, `emptyTitle`/`emptyIcon`.
   - Columna Acciones: botones icono `Printer` (Imprimir) y `Trash2` (Eliminar + `alert.confirm`).
5. `VehiculosPage.tsx`: eliminar el componente local `MantenimientoPanel` y la **2ª instancia** de `MantenimientoModal` (líneas 855-867). La pestaña Historial renderiza `<MantenimientoTab ... />`. El `MantenimientoModal` de página (líneas 540-552) queda como única instancia, abierta desde el Drawer.

## Fase 4 — Calidad y cierre

1. Convenciones: sin `any`, sin comentarios nuevos, variables CSS + Tailwind solo layout, `useAlert()`, tipos de `src/types/vehiculos.ts`.
2. No romper: KPIs inline (sin modal), print vía `.print-area`, `apiClient`, envelope `{ success, message, data }`.
3. Verificar:
   ```bash
   npm run build
   cd Backend_Sub33/Backend_Sub33
   dotnet build
   ```
   Backend debe quedar **detenido**. Si el exe bloquea: `dotnet build -p:OutDir=C:\Users\PC\AppData\Local\Temp\opencode\bsout\`
4. Actualizar `CONTEXTO.md`: sección Vehículos (drawer con pestañas, endpoint estado-operativo, Historial en DataTable sin duplicidad) y lista de pendientes.

---

## Archivos a tocar (resumen)

| Archivo | Acción |
|---------|--------|
| `src/app/pages/Vehiculos/components/VehiculoDrawer.tsx` | Refactor a 3 pestañas + bloque estado operativo |
| `src/app/pages/Vehiculos/components/MantenimientoTab.tsx` | **Nuevo** — Historial en DataTable |
| `src/app/pages/Vehiculos/VehiculosPage.tsx` | Extraer panel, quitar 2ª instancia del modal, handler estado operativo |
| `src/services/vehiculosService.ts` | + `cambiarEstadoOperativo` |
| `Backend_Sub33/.../DTOs/Vehiculos/VehiculoDtos.cs` | + `VehiculoEstadoOperativoDto` |
| `Backend_Sub33/.../Services/IVehiculoService.cs` | + `ChangeEstadoOperativoAsync` |
| `Backend_Sub33/.../Services/VehiculoService.cs` | Implementar cambio + bloqueo por mant. en proceso |
| `Backend_Sub33/.../Controllers/VehiculosController.cs` | + `PATCH {id}/estado-operativo` |
| `CONTEXTO.md` | Actualizar al cierre |

## Fuera de alcance

- KPIs inline (no tocar).
- Endpoints de resumen de vehículos / paginación de mant. (pendientes aparte).
- Módulos Finanzas / Reportes.
- Tests unitarios (pendiente global).
