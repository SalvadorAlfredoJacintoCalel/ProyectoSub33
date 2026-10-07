# PROMPT OPTIMIZADO — Módulo Emergencias 100% (Sub33)

## Contexto Mínimo Requerido
Lee solo: **`CONTEXTO.md`** (reglas del juego: stack, convenciones, BD, endpoints)

---

## Objetivo
Implementar módulo **Emergencias end-to-end** conectado **100% a Configuración** (catálogos dinámicos), sin tocar código que ya funciona.

---

## FASE 0 — Backend: Habilitar Catálogo `unidades` (30 min)
**Archivo:** `Backend_Sub33/Backend_Sub33/Controllers/ConfiguracionController.cs` (línea 24-33)

```csharp
// En Dictionary Catalogos, AGREGAR:
["unidades"] = new("cat_unidades", "unidad_id", "codigo_unidad", false),
```

Verificación: `GET /api/configuracion/catalogos/unidades` → 200 OK

---

## FASE 1 — BACKEND: DTOs + Controller + Service (4-6 hrs)

| Archivo | Acción |
|---------|--------|
| `DTOs/EmergenciaCreateDto.cs` + `UpdateDto.cs` | + `HoraToma` en SignosVitalesDto + FKs: `TipoEmergenciaId`, `HospitalDestinoId`, `UnidadAsignadaId`, `FormuladoPorId (Guid)`, `Resumen` |
| `Controllers/EmergenciasController.cs` | +4 endpoints: `GET /api/emergencias` (paginado+filtros), `GET /{id}`, `PUT /{id}`, `PATCH /{id}/estado` |
| `Services/EmergenciaService.cs` + `IEmergenciaService.cs` | Métodos: `GetPaginadoAsync`, `GetByIdAsync`, `CreateAsync` (transacción Dapper), `UpdateAsync` (transacción), `ChangeEstadoAsync` |

**Patrón:** `ApiControllerBase.Respond(ServiceResult<T>)` + transacción Dapper para relaciones (ver método `Registrar` actual).

**NO TOCAR:** `Registrar` (POST) y `ObtenerSiguienteIncidente` — ya funcionan.

---

## FASE 2 — FRONTEND: Tipos + Servicio + Hook (3-4 hrs)

| Archivo | Acción |
|---------|--------|
| `src/types/emergencia.ts` | Alinear con DTOs: agregar FKs + `HoraToma` + `PersonalAsignado.personalId?` |
| `src/services/emergenciaService.ts` | **REESCRIBIR COMPLETO** — eliminar mocks, CRUD real con `apiClient` |
| `src/hooks/useEmergencias.ts` | **NUEVO** — hook central: estado (lista, pagination, loading), acciones (load, create, update, delete), catálogos cacheados (tipos, hospitales, unidades, roles-servicio, personal) |

**Catálogos a usar (endpoints Configuración):**
- `getTiposEmergencia()` → `/configuracion/catalogos/tipos-emergencia`
- `getHospitales()` → `/configuracion/catalogos/hospitales`
- `getUnidades()` → `/configuracion/catalogos/unidades` (habilitado en FASE 0)
- `getRolesServicio()` → `/configuracion/catalogos/roles-servicio`
- `getPersonalDisponible()` → `/api/personal?estado=true`

---

## FASE 3 — REGISTER SERVICE PAGE (4-5 hrs)

**Archivo:** `src/app/pages/Emergencias/RegisterServicePage.tsx`

**ELIMINAR hardcodeados:**
- `fetch` directo `/siguiente-incidente` (l.92)
- Arrays: `tiposAsistencia` (l.63), `personalDisponible` (l.78), `HOSPITALES` (l.592), `UNIDADES` (l.864)
- Modal éxito custom (l.169-290)

**AGREGAR dinámico (via hook `useEmergencias`):**
- `useEffect` inicial: `loadCatalogos()` + `getSiguienteIncidente()`
- Select **Tipo Emergencia** (requerido): options=`catalogos.tiposEmergencia`, badge `requiere_unidad`
- Select **Hospital**: options=`catalogos.hospitales`, value=`hospital_id`
- Select **Unidad**: options=`catalogos.unidades`, value=`unidad_id`, muestra código+placa+estado
- Chips **Personal** + dropdown **RolEnServicio** c/u: options=`catalogos.rolesServicio`
- Textarea **Resumen**
- `handleSubmit` real con **FKs (IDs)** + parseo `Number()` signos vitales:

```typescript
const dto: EmergenciaCreate = {
  numeroIncidente, fecha, horaSalida, horaEntrada, solicitudTipo,
  tipoEmergenciaId: Number(selectedTipoEmergencia),
  tiposAsistencia: selectedTiposAsistencia,
  ubicacion,
  hospitalDestinoId: Number(selectedHospital),
  nombrePaciente, edad: Number(edad) || undefined, genero,
  solicitante, acompanante, fallecido, domicilio,
  presionArterial,
  frecuenciaCardiaca: Number(frecuenciaCardiaca) || undefined,
  frecuenciaRespiratoria: Number(frecuenciaRespiratoria) || undefined,
  saturacion: Number(saturacion) || undefined,
  estadoEntrega,
  unidadAsignadaId: Number(selectedUnidad),
  personalAsignado: personalConRoles.map(p => ({ 
    nombrePersonal: p.nombre, rolEnServicio: p.rol, personalId: p.id 
  })),
  signosVitales: { presionArterial, frecuenciaCardiaca: Number(...), ..., horaToma },
  resumen,
  creadoPorNombre: currentUser.name
};
await emergenciaService.registrarEmergencia(dto);
```

**Validaciones:** Requeridos (tipoEmergenciaId, tiposAsistencia[], ubicacion, nombrePaciente, hospitalDestinoId, unidadAsignadaId, personalAsignado[]), rangos (edad 0-120, saturación 0-100, FC 30-250), formato HH:mm.

**Errores/Éxito:** Error 400 → `AlertDialog` `details[]`; Error 500 → `AlertDialog`; Éxito → `sonner` toast + `onClose()` + refresh.

---

## FASE 4 — EMERGENCIAS PAGE / LISTADO (4-6 hrs)

**Archivo:** `src/app/pages/Emergencias/EmergenciasPage.tsx`

**ELIMINAR:**
- Tipo `Service` local (l.14-38) → usar `EmergenciaListItemDto`
- `INITIAL_SERVICES = []` (l.41)
- Filtros hardcodeados (l.979-993)
- Filtrado local `filteredServices` (l.806-807) → **filtrado en servidor**

**AGREGAR:**
- `const { emergencias, pagination, loading, catalogos, loadEmergencias, changeEstado } = useEmergencias()`
- `useEffect`: `await loadCatalogos(); await loadEmergencias()`
- Paginación real (Prev/Next, page size 10/25/50)
- Filtros → `loadEmergencias(filtros)` con debounce 300ms
- Botón "Registrar" → modal `RegisterServicePage`
- Click fila → `ServiceReportModal` con `EmergenciaResponseDto` completo
- "Editar" → modal `EditServicePage`
- "Desactivar" → `AlertDialog` variant `confirm` + `changeEstado(id, 'Inactivo')`

**Mantener:** CSS `@media print` en `ServiceReportModal`.

---

## FASE 5 — EDIT SERVICE PAGE (3-4 hrs)

**Archivo:** `src/app/pages/Emergencias/EditServicePage.tsx`

**ELIMINAR:** Props `Service` local, `onSave` callback, mapeo inverso hardcodeado (l.166-192).

**AGREGAR:**
- `useEffect`: `await getEmergenciaById(serviceId)` al montar
- Mapear `PersonalAsignadoDto[]` → UI con selector `RolEnServicio` (catálogo roles-servicio)
- Cargar signos vitales existentes
- Selects dinámicos desde hook
- `handleSubmit` real → `actualizarEmergencia(id, dto)` con FKs
- Errores/éxito con `AlertDialog` + `sonner`

---

## FASE 6 — ALERTDIALOG + SONNER (1-2 hrs)

**Archivo:** `src/app/components/AlertDialog.tsx`

```typescript
type AlertVariant = "default" | "confirm";

interface AlertDialogProps {
  // ... existentes
  variant?: AlertVariant;
  details?: string[];        // lista errores 400
  onConfirm?: () => void;    // callback para variant="confirm"
  confirmText?: string;      // "Sí, desactivar"
  cancelText?: string;       // "Cancelar"
}

// Lógica:
// - variant="confirm" → 2 botones (Cancelar / Confirmar)
// - details.length > 0 → <ul> debajo del mensaje
// - Auto-close SOLO warning/incomplete CON variant="default"
```

**Integrar `sonner`** (ya en package.json):
```typescript
import { toast } from "sonner";
toast.success("Registrado", { description: `Incidente ${numeroIncidente}` });
toast.error("Error", { description: msg });
toast.info("Cargando...");
```

---

## FASE 7 — TESTING E2E (2 hrs)

| Flujo | Verificación |
|-------|-------------|
| Registro | Toast éxito → lista actualizada → imprimir OK |
| Edición | Cambios persisten → lista actualizada |
| Desactivación | `AlertDialog` confirm → badge INACTIVO |
| Filtros | Servidor + paginación real |
| Config → Emergencias | Agregar hospital en Config → aparece en Emergencias |
| Errores 400/500 | `AlertDialog` con details / mensaje |

---

## 🚫 PROTEGIDO (NO TOCAR)

| Módulo | Archivos |
|--------|----------|
| Auth | `AuthContext.tsx`, `LoginPage.tsx`, JWT |
| Personal | `PersonalPage.tsx`, `PersonalService.ts`, `PersonalController` |
| Configuración | `SeguridadPage.tsx`, `configuracionService.ts`, `ConfiguracionController` |
| Backend Base | `Program.cs`, `AppDbContext`, entidades, migraciones |
| UI Base | `App.tsx`, `MainLayout`, `Sidebar`, `Topbar`, `ui/*` |
| Emergencias Existente | `POST /api/emergencias`, `GET /siguiente-incidente` |
| Impresión | `ServiceReportModal` CSS `@media print` |

---

## ✅ CHECKLIST ACEPTACIÓN

- [ ] `GET /configuracion/catalogos/unidades` → 200 OK
- [ ] `POST /emergencias` con FKs correctas
- [ ] `GET /emergencias` paginado + filtros servidor
- [ ] `GET /emergencias/{id}` completo con relaciones
- [ ] `PUT /emergencias/{id}` actualiza + reemplaza relaciones
- [ ] `PATCH /emergencias/{id}/estado` Activo↔Inactivo
- [ ] RegisterServicePage: selects desde Config (0 hardcodeados)
- [ ] Personal: selector `RolEnServicio` por miembro
- [ ] Signos vitales: `string`→`number` + `HoraToma`
- [ ] EmergenciasPage: tabla paginada servidor + modales
- [ ] EditServicePage: carga real + PUT real
- [ ] `AlertDialog` variant `confirm` en desactivar
- [ ] `AlertDialog` `details[]` errores 400
- [ ] `sonner` toasts éxito/info
- [ ] `npm run build` + `dotnet build` sin errores
- [ ] **Regresión:** Personal, Config, Auth, Impresión intactos

---

## ORDEN EJECUCIÓN

```
FASE 0 → FASE 1 (Backend + Swagger OK) → FASE 2 (TS compila)
→ FASE 3 (POST real) → FASE 4 (GET real + modales)
→ FASE 5 (PUT real) → FASE 6 (AlertDialog + sonner)
→ FASE 7 (E2E completo)
```

---

**Empezar por FASE 0 y confirmar Swagger antes de continuar.**