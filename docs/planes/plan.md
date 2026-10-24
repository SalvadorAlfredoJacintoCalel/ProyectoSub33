# Plan: Matriz de Permisos Completa — Frontend + Backend + BD + Gestión Jerárquica

**Fecha:** 2026-10-21
**Proyecto:** `C:\ProyectoSub33-main\ProyectoSub33-main`
**Objetivo:** Implementar control de acceso profesional por rol en todos los módulos, con UI jerárquica para que el admin asigne permisos granulares por módulo.

---

## 📊 ESTADO DE EJECUCIÓN (2026-10-22)

### ✅ YA IMPLEMENTADO Y FUNCIONANDO (Backend + Frontend + BD)

| # | Componente | Estado | Verificación |
|---|------------|--------|--------------|
| 1 | **BD: permisos_seed.sql** | ✅ Ejecutado | 45 permisos, asignación Admin(45)/Secretario(30)/Voluntario(8) |
| 2 | **BD: usuario_permisos + rol_permisos** | ✅ Creadas y pobladas | Tablas operativas |
| 3 | **Backend: SeguridadController - 4 endpoints granulares** | ✅ Implementados | GET/POST /permisos/listar\|asignar, /permisos/usuario/* |
| 4 | **Backend: [HttpRequirePermission] en 31 endpoints** | ✅ Aplicados | Personal, Inventario, Vehículos, Cupones, Donaciones, Libro, Emergencias |
| 5 | **Backend: Fix atributo HttpRequirePermission (era no-op)** | ✅ Corregido | Ahora valida claim `permiso` real |
| 6 | **Backend: Ownership EmergenciaService** | ✅ Implementado | Solo creador o admin edita/cambia estado → 403 |
| 7 | **Backend: Ownership DonacionService** | ✅ Implementado | Solo admin edita/elimina/cambia estado → 403 |
| 8 | **Backend: Claim personal_id en JWT + ICurrentUser** | ✅ Agregado | Necesario para ownership |
| 9 | **Frontend: usePermisos.ts hook centralizado** | ✅ Creado | Usa permisos+modulos de AuthContext |
| 10 | **Frontend: seguridadService.ts - 4 funciones granulares** | ✅ Agregadas | listarPermisosPorRol, asignarPermisosRol, etc. |
| 11 | **Frontend: Guards en 13 páginas/componentes** | ✅ Aplicados | Personal, Inventario(4), Vehículos(4), Donaciones(2), Emergencias(2) |
| 12 | **Frontend: SeguridadPage pestaña "Matriz de Permisos"** | ✅ UI jerárquica | Selector Rol/Usuario + acordeones + master toggle + autoguardado |
| 13 | **Fix: PersonalService.ChangeEstadoAsync sincroniza ambas tablas** | ✅ Aplicado | `personal.Estado` + `usuarios.Estado` sincronizados |
| 14 | **Usuario sjacinto activado en BD** | ✅ Hecho | Ambas tablas en `estado = true` |
| 15 | **Builds verificados** | ✅ Pasando | `dotnet build` 0 errores · `npm run build` 0 errores |

### ⚠️ PENDIENTE (Cambios menores no aplicados al código real)

| # | Tarea | Archivo | Descripción |
|---|-------|---------|-------------|
| 1 | **Quitar badge técnico en permisos** | `src/app/pages/Seguridad/SeguridadPage.tsx` líneas 1028-1033 | Eliminar `<span className="ml-2 font-mono...">{permiso.codigo}</span>` que muestra `emergencias.ver`, `inventario.ajuste`, etc. El plan.md YA tiene el JSX corregido (solo nombre + descripción) |
| 2 | **Actualizar CONTEXTO.md** | `CONTEXTO.md` | Reflejar todos los cambios implementados arriba |

---

## ⚠️ PENDIENTE — Instrucciones exactas para la IA que continúe

### Tarea 1: Quitar badge técnico en matriz de permisos (2 minutos)

**Archivo:** `src/app/pages/Seguridad/SeguridadPage.tsx` (líneas ~1026-1037)

**Código ACTUAL (tiene badge gris):**
```tsx
<div className="flex-1 min-w-0">
  <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "var(--text-1)" }}>
    {permiso.nombre}
    <span
      className="ml-2 font-mono text-xs px-1.5 py-0.5 rounded"
      style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}
    >
      {permiso.codigo}
    </span>
  </p>
  {permiso.descripcion && (
    <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--text-3)" }}>{permiso.descripcion}</p>
  )}
</div>
```

**Código CORREGIDO (aplicar):**
```tsx
<div className="flex-1 min-w-0">
  <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "var(--text-1)" }}>
    {permiso.nombre}
  </p>
  {permiso.descripcion && (
    <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--text-3)" }}>{permiso.descripcion}</p>
  )}
</div>
```

**Verificación:** `npm run build` → 0 errores. En UI: solo "Ver emergencias", sin `[emergencias.ver]`.

---

### Tarea 2: Actualizar CONTEXTO.md (5 minutos)

Agregar al final del archivo la sección "Últimos cambios (2026-10-22)" con el resumen de la tabla ✅ arriba.

---

## Matriz de Permisos Definitiva (Runtime)

| Módulo | Acción | `admin` | `secretario` | `voluntario` | Nota |
|--------|--------|---------|--------------|--------------|------|
| **Seguridad** | Ver/Editar todo (parámetros, catálogos, usuarios, roles, permisos) | ✅ | ❌ (AccessDenied) | ❌ | Ya implementado con `AccessDenied` |
| **Personal** | Listar/Ver detalle | ✅ | ✅ | ❌ | Solo admin ve botón "Nuevo Miembro" |
| | Crear/Editar/Eliminar/Cambiar estado/Acceso sistema | ✅ | ❌ | ❌ | |
| **Inventario** | Ver items, Kardex, Ubicaciones | ✅ | ✅ | ✅ | |
| | Registrar uso en servicio | ✅ | ✅ | ✅ | |
| | Crear/Editar items | ✅ | ✅ | ❌ | |
| | **Baja/Eliminar items, Ajustes (AJUSTE)** | ✅ | ✅ | ❌ | Admin + Secretario |
| | Asignar equipo a unidades | ✅ | ✅ | ❌ | |
| **Vehículos** | Ver flota, KPIs, Detalle | ✅ | ✅ | ✅ | |
| | Registrar cupones | ✅ | ✅ | ✅ | |
| | CRUD vehículos, Estado operativo | ✅ | ✅ | ❌ | Admin + Secretario |
| | CRUD mantenimientos, Imprimir hoja | ✅ | ✅ | ❌ | Admin + Secretario |
| **Donaciones** | Ver listado, Libro mensual | ✅ | ✅ | ❌ | |
| | **Registrar donaciones (Material/Monetaria)** | ✅ | ✅ | ❌ | Secretario SOLO registrar |
| | Editar/Eliminar/Cambiar estado donaciones | ✅ | ❌ | ❌ | **NO editar montos** (prevención fraude) |
| | Libro mensual: Crear/Editar/Eliminar movimientos | ✅ | ✅ | ❌ | |
| **Emergencias** | Ver listado (oculta Inactivo por defecto) | ✅ | ✅ | ✅ | |
| | **Crear emergencia** | ✅ | ✅ | ✅ | |
| | **Editar propia / Cambiar estado propia** | ✅ | ✅ | ✅ | **Ownership-based**: solo creador |
| | Editar ajena / Cambiar estado ajena | ✅ | ❌ | ❌ | Solo admin |
| | Ver detalle cualquier emergencia | ✅ | ✅ | ✅ | |
| **Finanzas/Reportes/Perfil** | Solo UI (mock) | ✅ | ✅ | ✅ | Sin backend |

---

## Reglas de Negocio Clave

1. **Ownership en Emergencias**: `emergencias_servicios.formulado_por_id` = `usuario.personalId` → solo ese usuario puede editar/cambiar estado
2. **Anti-fraude Donaciones**: Secretario registra, **NO edita montos/estados** una vez guardados
3. **Seguridad**: Ya tiene `AccessDenied` component que bloquea todo el módulo a no-admins
4. **Personal**: Secretario ve listado/detalle pero **CERO botones de acción**
5. **Inventario/Vehículos**: Secretario tiene permisos operativos completos (ajustes, bajas, mantenimientos)

---

## ARQUITECTURA DE PERMISOS — Backend (BD ya soporta)

### Tablas Existentes
```sql
-- CatModulo: modulo_id, codigo_modulo, nombre_modulo
-- Permiso: permiso_id, modulo_id, codigo, nombre, descripcion
-- RolPermiso: rol_id, permiso_id
-- UsuarioPermiso: usuario_id, permiso_id (opcional, override)
-- RolModulo / UsuarioModulo: LEGACY - NO USAR para nueva arquitectura
```

### Permisos a Sembrar (30+ granulares)

```sql
-- Ver: docs/permisos_seed.sql (incluido al final de este plan)
-- Códigos siguen patrón: {modulo}.{accion}
-- Ej: personal.crear, inventario.ajuste, vehiculos.mantenimientos.crear, donaciones.libro.editar
```

### Endpoints Backend (SeguridadController.cs)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/seguridad/permisos/listar/{rolId}` | Devuelve permisos **agrupados por módulo** con `asignado: true/false` |
| POST | `/api/seguridad/permisos/asignar` | Body: `{ rolId: int, permisoIds: int[] }` — Reemplaza todos los permisos del rol |
| GET | `/api/seguridad/permisos/usuario/{usuarioId}` | Permisos efectivos de un usuario (rol + overrides) |
| POST | `/api/seguridad/permisos/usuario/asignar` | Body: `{ usuarioId: guid, permisoIds: int[] }` — Overrides de usuario |

**Estructura respuesta GET `/listar/{rolId}`:**
```json
[
  {
    "moduloId": 1,
    "moduloCodigo": "personal",
    "moduloNombre": "Personal",
    "permisos": [
      { "permisoId": 1, "codigo": "personal.crear", "nombre": "Crear miembro", "descripcion": "Registrar nuevo miembro", "asignado": true },
      { "permisoId": 2, "codigo": "personal.editar", "nombre": "Editar miembro", "descripcion": "Modificar datos de miembro", "asignado": false }
    ]
  },
  { "moduloId": 2, "moduloCodigo": "inventario", "moduloNombre": "Inventario", "permisos": [...] }
]
```

---

## FRONTEND — Guards por Componente (Patrón Unificado)

### Hook de Permisos Reutilizable
```tsx
// src/hooks/usePermisos.ts (NUEVO)
import { useAuth } from "@/context/AuthContext";

export function usePermisos() {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";
  const isSecretario = role === "secretario";
  const isVoluntario = role === "voluntario";
  const currentUserId = user?.personalId;

  // Helpers por módulo
  const personal = {
    ver: isAdmin || isSecretario,
    crear: isAdmin,
    editar: isAdmin,
    cambiarEstado: isAdmin,
    accesoSistema: isAdmin,
    eliminar: isAdmin,
  };

  const inventario = {
    ver: true,
    registrarUsoServicio: true,
    crear: isAdmin || isSecretario,
    editar: isAdmin || isSecretario,
    baja: isAdmin || isSecretario,
    ajustes: isAdmin || isSecretario,
    asignarEquipo: isAdmin || isSecretario,
  };

  const vehiculos = {
    ver: true,
    registrarCupones: true,
    crud: isAdmin || isSecretario,
    estadoOperativo: isAdmin || isSecretario,
    mantenimientos: isAdmin || isSecretario,
    cupones: isAdmin || isSecretario,
  };

  const donaciones = {
    ver: isAdmin || isSecretario,
    registrar: isAdmin || isSecretario,
    editar: isAdmin,           // Anti-fraude
    cambiarEstado: isAdmin,    // Anti-fraude
    eliminar: isAdmin,         // Anti-fraude
    libro: isAdmin || isSecretario,
  };

  const emergencias = {
    ver: true,
    crear: true,
    editarPropia: (formuladoPorId: string) => isAdmin || currentUserId === formuladoPorId,
    cambiarEstadoPropia: (formuladoPorId: string) => isAdmin || currentUserId === formuladoPorId,
    editarAjena: isAdmin,
    cambiarEstadoAjena: isAdmin,
  };

  const seguridad = {
    ver: isAdmin,
    editar: isAdmin,
  };

  return { isAdmin, isSecretario, isVoluntario, currentUserId, personal, inventario, vehiculos, donaciones, emergencias, seguridad };
}
```

### Archivos y Cambios Exactos

| Archivo | Cambios |
|---------|---------|
| `src/hooks/usePermisos.ts` | **NUEVO** - Hook centralizado con todos los helpers |
| `src/app/pages/Personal/PersonalPage.tsx` | Importar `usePermisos`; botón "Nuevo Miembro" → `personal.crear`; Drawer footer Editar/Imprimir → `personal.editar`; deshabilitar click-editar en filas |
| `src/app/pages/Inventario/InventarioPage.tsx` | Botones Crear/Editar/Baja/Ajuste → `inventario.crear/editar/baja/ajustes` |
| `src/app/pages/Inventario/MovimientosPage.tsx` | Botón "Ajuste de Inventario" → `inventario.ajustes` |
| `src/app/pages/Inventario/EquipoUnidadesPage.tsx` | Botones asignar/editar → `inventario.asignarEquipo` |
| `src/app/pages/Inventario/ServicioInsumosPage.tsx` | Registrar uso → `inventario.registrarUsoServicio` (true para todos); UI solo lectura si voluntario |
| `src/app/pages/Vehiculos/VehiculosPage.tsx` | Botones Crear/Editar/Estado operativo/Mantenimientos → `vehiculos.crud/estadoOperativo/mantenimientos` |
| `src/app/pages/Vehiculos/components/VehiculoDrawer.tsx` | Footer Imprimir/Editar/Estado operativo → `vehiculos.crud/estadoOperativo` |
| `src/app/pages/Vehiculos/components/MantenimientoTab.tsx` | Botones Registrar/Completar/Imprimir/Eliminar → `vehiculos.mantenimientos` |
| `src/app/pages/Vehiculos/CuponesTab.tsx` | Crear/Editar/Eliminar cupón → `vehiculos.cupones`; Firmar → true |
| `src/app/pages/Donaciones/DonacionesPage.tsx` | Registrar → `donaciones.registrar`; Editar/Eliminar/Estado → `donaciones.editar/cambiarEstado/eliminar` (solo admin); Libro → `donaciones.libro` |
| `src/app/pages/Donaciones/LibroDonacionesTab.tsx` | Movimientos CRUD → `donaciones.libro` |
| `src/app/pages/Emergencias/EmergenciasPage.tsx` | **Ownership**: `canEdit = emergencias.editarPropia(record.formuladoPorId)` → botones Editar/Estado |
| `src/app/pages/Emergencias/EmergenciaFormPage.tsx` | Deshabilitar campos si `!canEdit` (excepto admin) |

---

## FRONTEND — SeguridadPage: Pestaña Permisos Jerárquica (NUEVA UI)

### Archivo: `src/app/pages/Seguridad/SeguridadPage.tsx` — Reemplazar pestaña "permisos" (líneas 772-808)

```tsx
// NUEVOS ESTADOS
const [permisoTarget, setPermisoTarget] = useState<"rol" | "usuario">("rol");
const [selectedRolId, setSelectedRolId] = useState<number | null>(null);
const [selectedUsuarioId, setSelectedUsuarioId] = useState<string | null>(null);
const [permisosAgrupados, setPermisosAgrupados] = useState<ModuloConPermisos[]>([]);
const [loadingPermisos, setLoadingPermisos] = useState(false);

// NUEVAS FUNCIONES
async function cargarPermisos() {
  setLoadingPermisos(true);
  try {
    let data: PermisoGranular[];
    if (permisoTarget === "rol" && selectedRolId) {
      data = await listarPermisosPorRol(selectedRolId);
    } else if (permisoTarget === "usuario" && selectedUsuarioId) {
      data = await listarPermisosPorUsuario(selectedUsuarioId);
    } else {
      setPermisosAgrupados([]);
      return;
    }
    // Agrupar por módulo
    const agrupados = Object.values(
      data.reduce((acc, p) => {
        if (!acc[p.moduloId]) {
          acc[p.moduloId] = { moduloId: p.moduloId, moduloCodigo: p.moduloCodigo, moduloNombre: p.moduloNombre, permisos: [] };
        }
        acc[p.moduloId].permisos.push(p);
        return acc;
      }, {} as Record<number, ModuloConPermisos>)
    );
    setPermisosAgrupados(agrupados);
  } catch (e) {
    console.error(e);
    toast.error("Error cargando permisos");
  } finally {
    setLoadingPermisos(false);
  }
}

async function handleTogglePermiso(permisoId: number, asignado: boolean) {
  const nuevos = permisosAgrupados.flatMap(m => m.permisos)
    .filter(p => p.permisoId !== permisoId)
    .concat({ ...permisosAgrupados.flatMap(m => m.permisos).find(p => p.permisoId === permisoId)!, asignado });
  const permisoIds = nuevos.filter(p => p.asignado).map(p => p.permisoId);
  try {
    if (permisoTarget === "rol" && selectedRolId) {
      await asignarPermisosRol(selectedRolId, permisoIds);
    } else if (permisoTarget === "usuario" && selectedUsuarioId) {
      await asignarPermisosUsuario(selectedUsuarioId, permisoIds);
    }
    toast.success("Permisos actualizados");
    await cargarPermisos();
  } catch (e) {
    toast.error("Error guardando permisos");
  }
}

function handleModuloMasterToggle(moduloId: number, checked: boolean) {
  const modulo = permisosAgrupados.find(m => m.moduloId === moduloId);
  if (!modulo) return;
  const nuevos = permisosAgrupados.map(m => 
    m.moduloId === moduloId ? { ...m, permisos: m.permisos.map(p => ({ ...p, asignado: checked })) } : m
  );
  setPermisosAgrupados(nuevos);
  const permisoIds = nuevos.flatMap(m => m.permisos).filter(p => p.asignado).map(p => p.permisoId);
  if (permisoTarget === "rol" && selectedRolId) asignarPermisosRol(selectedRolId, permisoIds);
  else if (permisoTarget === "usuario" && selectedUsuarioId) asignarPermisosUsuario(selectedUsuarioId, permisoIds);
}

// JSX REEMPLAZA {activeTab === "permisos" && (...)}
{activeTab === "permisos" && (
  <div style={{ maxWidth: 900, background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", padding: 24 }}>
    {/* Selector Rol/Usuario */}
    <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>Configurar:</label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="radio" value="rol" checked={permisoTarget === "rol"} onChange={() => setPermisoTarget("rol")} />
          <span style={{ fontSize: 13, color: "var(--text-1)" }}>Rol</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="radio" value="usuario" checked={permisoTarget === "usuario"} onChange={() => setPermisoTarget("usuario")} />
          <span style={{ fontSize: 13, color: "var(--text-1)" }}>Usuario</span>
        </label>
      </div>
      {permisoTarget === "rol" && (
        <Field label="Rol" style={{ flex: 1, minWidth: 200 }}>
          <select value={selectedRolId ?? ""} onChange={(e) => { setSelectedRolId(e.target.value ? Number(e.target.value) : null); setSelectedUsuarioId(null); cargarPermisos(); }} style={inputStyle()}>
            <option value="">Seleccionar rol</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
        </Field>
      )}
      {permisoTarget === "usuario" && (
        <Field label="Usuario" style={{ flex: 1, minWidth: 200 }}>
          <select value={selectedUsuarioId ?? ""} onChange={(e) => { setSelectedUsuarioId(e.target.value || null); setSelectedRolId(null); cargarPermisos(); }} style={inputStyle()}>
            <option value="">Seleccionar usuario</option>
            {usuarios.map(u => <option key={u.usuarioId} value={u.usuarioId}>{u.nombreCompleto} (@{u.username})</option>)}
          </select>
        </Field>
      )}
    </div>

    {loadingPermisos ? (
      <p style={{ color: "var(--text-3)", fontSize: 13, textAlign: "center", padding: 40 }}>Cargando permisos...</p>
    ) : !selectedRolId && !selectedUsuarioId ? (
      <p style={{ color: "var(--text-3)", fontSize: 13, textAlign: "center", padding: 40 }}>Seleccione un rol o usuario para gestionar sus permisos</p>
    ) : permisosAgrupados.length === 0 ? (
      <p style={{ color: "var(--text-3)", fontSize: 13, textAlign: "center", padding: 40 }}>No hay permisos definidos en el sistema</p>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {permisosAgrupados.map((modulo) => {
          const todosAsignados = modulo.permisos.length > 0 && modulo.permisos.every(p => p.asignado);
          const algunoAsignado = modulo.permisos.some(p => p.asignado);
          return (
            <div key={modulo.moduloId} style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--bg-input)" }}>
              {/* Header Módulo con Master Toggle */}
              <button
                onClick={() => handleModuloMasterToggle(modulo.moduloId, !todosAsignados)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: todosAsignados ? "var(--brand-50)" : "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <input
                  type="checkbox"
                  checked={todosAsignados}
                  indeterminate={algunoAsignado && !todosAsignados}
                  onChange={(e) => e.stopPropagation()}
                  className="w-5 h-5 accent-brand-600"
                />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{modulo.moduloNombre}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-3)" }}>
                    {modulo.permisos.filter(p => p.asignado).length} de {modulo.permisos.length} permisos
                    <span className="ml-2 font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
                      {modulo.moduloCodigo}
                    </span>
                  </p>
                </div>
                <ChevronDown size={16} style={{ color: "var(--text-3)" }} />
              </button>

              {/* Permisos del Módulo (colapsable) */}
              <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
                {modulo.permisos.map((permiso) => (
                  <label key={permiso.permisoId} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--bg-hover)] border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                    <input
                      type="checkbox"
                      checked={permiso.asignado}
                      onChange={(e) => handleTogglePermiso(permiso.permisoId, e.target.checked)}
                      className="w-4 h-4 accent-brand-600 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "var(--text-1)" }}>
                        {permiso.nombre}
                      </p>
                      {permiso.descripcion && <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--text-3)" }}>{permiso.descripcion}</p>}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}
```

### Tipos Nuevos (en archivo o inline)
```typescript
interface PermisoGranular {
  permisoId: number;
  moduloId: number;
  moduloCodigo: string;
  moduloNombre: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  asignado: boolean;
}

interface ModuloConPermisos {
  moduloId: number;
  moduloCodigo: string;
  moduloNombre: string;
  permisos: PermisoGranular[];
}
```

---

## BACKEND — Controllers + Services (Atributos + Validación)

### Controllers - Agregar `[HttpRequirePermission("codigo.permiso")]`

| Controller | Endpoint | Permiso |
|------------|----------|---------|
| `PersonalController` | POST `/api/personal` | `personal.crear` |
| | PUT `/{id}` | `personal.editar` |
| | PATCH `/{id}/estado` | `personal.cambiar-estado` |
| | PUT `/{id}/acceso-sistema` | `personal.acceso-sistema` |
| | DELETE `/{id}` | `personal.eliminar` |
| `InventarioController` | POST `/items` | `inventario.crear` |
| | PUT `/items/{id}` | `inventario.editar` |
| | POST `/items/{id}/baja` | `inventario.baja` |
| | DELETE `/items/{id}` | `inventario.eliminar` |
| | POST `/movimientos` | `inventario.ajuste` |
| | POST `/equipo-unidades` | `inventario.equipo-asignar` |
| | POST `/servicio-insumos` | `inventario.servicio-insumos` |
| `VehiculosController` | POST `/api/vehiculos` | `vehiculos.crear` |
| | PUT `/{id}` | `vehiculos.editar` |
| | PATCH `/{id}/estado` | `vehiculos.cambiar-estado` |
| | PATCH `/{id}/estado-operativo` | `vehiculos.estado-operativo` |
| | DELETE `/{id}` | `vehiculos.eliminar` |
| | POST `/{id}/mantenimientos` | `vehiculos.mantenimientos.crear` |
| | PUT `/mantenimientos/{id}` | `vehiculos.mantenimientos.editar` |
| | DELETE `/mantenimientos/{id}` | `vehiculos.mantenimientos.eliminar` |
| `CuponesController` | POST `/cupones` | `vehiculos.cupones.crear` |
| | PUT `/{id}` | `vehiculos.cupones.editar` |
| | DELETE `/{id}` | `vehiculos.cupones.eliminar` |
| | PUT `/periodos` | `vehiculos.cupones.periodos` |
| `DonacionesController` | POST `/api/donaciones` | `donaciones.registrar` |
| | PUT `/{id}` | `donaciones.editar` |
| | PATCH `/{id}/estado` | `donaciones.cambiar-estado` |
| | DELETE `/{id}` | `donaciones.eliminar` |
| `DonacionLibroController` | POST `/movimientos` | `donaciones.libro.crear` |
| | PUT `/movimientos/{id}` | `donaciones.libro.editar` |
| | DELETE `/movimientos/{id}` | `donaciones.libro.eliminar` |
| `EmergenciasController` | POST `/api/emergencias` | `emergencias.crear` |
| | PUT `/{id}` | `emergencias.editar` |
| | PATCH `/{id}/estado` | `emergencias.cambiar-estado` |

### Services - Validación Ownership (Crítico)

**`EmergenciaService.cs` - `UpdateAsync` y `ChangeEstadoAsync`:**
```csharp
var currentUserId = GetCurrentUserIdFromClaims(); // ClaimTypes.NameIdentifier -> personalId
var emergencia = await GetByIdAsync(id, ct);
if (emergencia.FormuladoPorId != currentUserId && !await IsAdminAsync(currentUserId, ct)) {
    throw new UnauthorizedAccessException("Solo el creador o un administrador pueden modificar esta emergencia");
}
```

**`DonacionService.cs` - `UpdateAsync`, `ChangeEstadoAsync`, `DeleteAsync`:**
```csharp
if (!await IsAdminAsync(currentUserId, ct)) {
    throw new UnauthorizedAccessException("Solo administradores pueden modificar donaciones registradas");
}
```

---

## BASE DE DATOS — Script Completo Permisos

**Archivo:** `docs/permisos_seed.sql` (crear y ejecutar antes de migraciones)

```sql
-- =============================================
-- PERMISOS GRANULARES POR MÓDULO
-- Ejecutar en orden: 1) Limpiar permisos viejos 2) Insertar nuevos 3) Asignar a roles
-- =============================================

-- 1. LIMPIAR (opcional, si re-ejecutando)
-- DELETE FROM rol_permisos;
-- DELETE FROM permisos;

-- 2. INSERTAR PERMISOS (modulo_id referenciado a cat_modulos)
-- Obtener modulo_ids primero:
-- SELECT modulo_id, codigo_modulo FROM cat_modulos;

-- PERSONAL
INSERT INTO permisos (permiso_id, modulo_id, codigo, nombre, descripcion) VALUES
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='personal'), 'personal.crear', 'Crear miembro', 'Registrar nuevo miembro en el sistema'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='personal'), 'personal.editar', 'Editar miembro', 'Modificar datos de miembro existente'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='personal'), 'personal.cambiar-estado', 'Cambiar estado miembro', 'Activar/desactivar miembro'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='personal'), 'personal.acceso-sistema', 'Gestionar acceso al sistema', 'Crear/editar credenciales y asignar rol'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='personal'), 'personal.eliminar', 'Eliminar miembro', 'Desactivar miembro permanentemente (soft delete)');

-- INVENTARIO
INSERT INTO permisos (permiso_id, modulo_id, codigo, nombre, descripcion) VALUES
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='inventario'), 'inventario.ver', 'Ver inventario', 'Listado, kardex, ubicaciones, KPIs'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='inventario'), 'inventario.registrar-uso-servicio', 'Registrar uso en servicio', 'Consumir insumos durante emergencia'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='inventario'), 'inventario.crear', 'Crear item', 'Registrar nuevo insumo/equipo con stock inicial'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='inventario'), 'inventario.editar', 'Editar item', 'Modificar datos de item existente'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='inventario'), 'inventario.baja', 'Dar de baja item', 'Baja lógica con responsable y fecha'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='inventario'), 'inventario.eliminar', 'Eliminar item', 'Eliminación física del registro'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='inventario'), 'inventario.ajuste', 'Ajuste de inventario', 'Movimiento AJUSTE con delta firmado (positivo/negativo)'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='inventario'), 'inventario.equipo-asignar', 'Asignar equipo a unidades', 'Upsert en tabla equipo_unidades');

-- VEHÍCULOS
INSERT INTO permisos (permiso_id, modulo_id, codigo, nombre, descripcion) VALUES
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 'vehiculos.ver', 'Ver flota', 'Listado, KPIs, detalle, tarjetas'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 'vehiculos.registrar-cupones', 'Registrar cupones', 'Crear cupones de combustible propios'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 'vehiculos.crear', 'Crear vehículo', 'Alta en flota'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 'vehiculos.editar', 'Editar vehículo', 'Modificar datos de flota'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 'vehiculos.cambiar-estado', 'Cambiar estado vehículo', 'Activar/Inactivar'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 'vehiculos.estado-operativo', 'Cambiar estado operativo', 'Operativa/Mantenimiento/En Servicio/Fuera de Servicio'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 'vehiculos.eliminar', 'Eliminar vehículo', 'Desactivar de flota (soft delete)'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 'vehiculos.mantenimientos.crear', 'Registrar mantenimiento', 'Ingreso/avance/finalización de hoja'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 'vehiculos.mantenimientos.editar', 'Editar mantenimiento', 'Modificar hoja de mantenimiento'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 'vehiculos.mantenimientos.eliminar', 'Eliminar mantenimiento', 'Borrar hoja de mantenimiento'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 'vehiculos.mantenimientos.imprimir', 'Imprimir hoja mantenimiento', 'Generar PDF de hoja individual'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 'vehiculos.cupones.crear', 'Crear cupón', 'Registrar cupón de combustible'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 'vehiculos.cupones.editar', 'Editar cupón', 'Modificar cupón existente'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 'vehiculos.cupones.eliminar', 'Eliminar cupón', 'Borrar cupón'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 'vehiculos.cupones.periodos', 'Gestionar periodos', 'Crear/actualizar periodos mensuales');

-- DONACIONES
INSERT INTO permisos (permiso_id, modulo_id, codigo, nombre, descripcion) VALUES
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='donaciones'), 'donaciones.ver', 'Ver donaciones', 'Listado, detalle, libro mensual'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='donaciones'), 'donaciones.registrar', 'Registrar donación', 'Alta material/monetaria (genera item inventario si material)'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='donaciones'), 'donaciones.editar', 'Editar donación', 'Modificar donación registrada (SOLO ADMIN - anti-fraude)'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='donaciones'), 'donaciones.cambiar-estado', 'Cambiar estado donación', 'SOLO ADMIN'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='donaciones'), 'donaciones.eliminar', 'Eliminar donación', 'SOLO ADMIN'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='donaciones'), 'donaciones.libro.crear', 'Crear movimiento libro', 'Registrar asiento en libro mensual'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='donaciones'), 'donaciones.libro.editar', 'Editar movimiento libro', 'Modificar asiento del libro'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='donaciones'), 'donaciones.libro.eliminar', 'Eliminar movimiento libro', 'Borrar asiento del libro');

-- EMERGENCIAS
INSERT INTO permisos (permiso_id, modulo_id, codigo, nombre, descripcion) VALUES
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='emergencias'), 'emergencias.ver', 'Ver emergencias', 'Listado, detalle, siguientes incidentes'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='emergencias'), 'emergencias.crear', 'Crear emergencia', 'Registrar servicio con vehículo e insumos'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='emergencias'), 'emergencias.editar', 'Editar emergencia', 'Modificar servicio (validado ownership en service)'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='emergencias'), 'emergencias.cambiar-estado', 'Cambiar estado emergencia', 'En proceso → Terminado → Inactivo (validado ownership)');

-- SEGURIDAD/CONFIGURACIÓN (Solo admin - ya bloqueado por AccessDenied en frontend)
INSERT INTO permisos (permiso_id, modulo_id, codigo, nombre, descripcion) VALUES
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='seguridad'), 'seguridad.parametros', 'Gestionar parámetros', 'Editar parámetros del sistema'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='seguridad'), 'seguridad.catalogos', 'Gestionar catálogos', 'CRUD listas maestras (rangos, roles, tipos, hospitales, etc.)'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='seguridad'), 'seguridad.usuarios', 'Gestionar usuarios', 'Cambiar rol/estado/username/password'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='seguridad'), 'seguridad.permisos', 'Gestionar permisos', 'Matriz de permisos por rol/usuario'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='seguridad'), 'seguridad.roles', 'Gestionar roles', 'CRUD roles del sistema');

-- 3. ASIGNACIÓN A ROLES
-- ADMIN: TODOS
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.rol_id, p.permiso_id
FROM roles r, permisos p
WHERE r.nombre = 'admin';

-- SECRETARIO: Operativos (sin seguridad, sin personal.*, sin donaciones.editar/eliminar/estado)
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.rol_id, p.permiso_id
FROM roles r, permisos p
WHERE r.nombre = 'secretario'
  AND p.codigo IN (
    'inventario.ver','inventario.registrar-uso-servicio','inventario.crear','inventario.editar',
    'inventario.baja','inventario.ajuste','inventario.equipo-asignar',
    'vehiculos.ver','vehiculos.registrar-cupones','vehiculos.crear','vehiculos.editar',
    'vehiculos.cambiar-estado','vehiculos.estado-operativo',
    'vehiculos.mantenimientos.crear','vehiculos.mantenimientos.editar','vehiculos.mantenimientos.eliminar','vehiculos.mantenimientos.imprimir',
    'vehiculos.cupones.crear','vehiculos.cupones.editar','vehiculos.cupones.eliminar','vehiculos.cupones.periodos',
    'donaciones.ver','donaciones.registrar','donaciones.libro.crear','donaciones.libro.editar','donaciones.libro.eliminar',
    'emergencias.ver','emergencias.crear','emergencias.editar','emergencias.cambiar-estado'
  );

-- VOLUNTARIO: Básicos + ownership en emergencias
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.rol_id, p.permiso_id
FROM roles r, permisos p
WHERE r.nombre = 'voluntario'
  AND p.codigo IN (
    'inventario.ver','inventario.registrar-uso-servicio',
    'vehiculos.ver','vehiculos.registrar-cupones',
    'emergencias.ver','emergencias.crear','emergencias.editar','emergencias.cambiar-estado'
  );
```

---

## ORDEN DE IMPLEMENTACIÓN OBLIGATORIO

### Paso 1: Base de Datos
```bash
# 1. Ejecutar script permisos_seed.sql en PostgreSQL
# 2. dotnet ef database update
```

### Paso 2: Backend
```bash
# 1. Agregar endpoints en SeguridadController.cs (listar/asignar permisos granulares)
# 2. Agregar [HttpRequirePermission("...")] a TODOS los controllers listados arriba
# 3. Implementar validación ownership en EmergenciaService.cs y DonacionService.cs
# 4. dotnet build → 0 errores
```

### Paso 3: Frontend - Servicios + Hook
```bash
# 1. Crear src/hooks/usePermisos.ts
# 2. Agregar listarPermisosPorRol, listarPermisosPorUsuario, asignarPermisosRol, asignarPermisosUsuario en seguridadService.ts
# 3. npm run build → verificar types
```

### Paso 4: Frontend - Guards en Páginas
```bash
# Aplicar usePermisos() en cada página listada en tabla "Archivos y Cambios Exactos"
# npm run build → 0 errores
```

### Paso 5: Frontend - SeguridadPage Pestaña Permisos
```bash
# Reemplazar líneas 772-808 con nueva UI jerárquica (acordeones + master toggle)
# npm run build → 0 errores
```

### Paso 6: Testing Manual (3 Usuarios)
| Usuario | Verificar |
|---------|-----------|
| **Admin** | Todo accesible, Seguridad funcional, Permisos UI jerárquica guarda correctamente |
| **Secretario** | Personal (solo ver), Inventario/Vehículos/Donaciones/Emergencias (operativo), Seguridad (AccessDenied), Donaciones NO editar/eliminar |
| **Voluntario** | Inventario (ver + uso servicio), Vehículos (ver + cupones), Emergencias (crear + editar PROPIAS), Sin acceso Personal/Donaciones/Seguridad |

---

## VERIFICACIÓN OBLIGATORIA FINAL

```bash
# Frontend
npm run build          # 0 errores, 0 warnings nuevos

# Backend
cd Backend_Sub33/Backend_Sub33
dotnet build           # 0 errores

# BD
dotnet ef database update  # Sin errores
```

**Testing funcional:**
1. Login admin → Seguridad → Permisos → Seleccionar "Secretario" → Ver acordeones → Desmarcar `inventario.ajuste` → Guardar
2. Login secretario → Inventario → Botón "Ajuste de Inventario" **NO visible**
3. Login voluntario → Emergencias → Crear 2 emergencias → Editar propia ✅ → Editar ajena ❌ (botón oculto)
4. Login secretario → Donaciones → Registrar donación ✅ → Editar donación ❌ (botón oculto)

---

## ARCHIVOS CLAVE PARA REFERENCIA RÁPIDA

| Archivo | Propósito |
|---------|-----------|
| `src/hooks/usePermisos.ts` | **NUEVO** - Hook centralizado de permisos |
| `src/services/seguridadService.ts` | Funciones `listarPermisosPorRol`, `asignarPermisosRol`, etc. |
| `src/app/pages/Seguridad/SeguridadPage.tsx` | Pestaña "permisos" refactorizada (líneas 772-808) |
| `Backend_Sub33/Backend_Sub33/Controllers/SeguridadController.cs` | Endpoints granulares |
| `Backend_Sub33/Backend_Sub33/Services/EmergenciaService.cs` | Validación ownership |
| `Backend_Sub33/Backend_Sub33/Services/DonacionService.cs` | Bloqueo edición no-admin |
| `docs/permisos_seed.sql` | Script BD permisos + asignación roles |
| `src/constants/roles.ts:28-31` | `ROLE_NAV` navegación por rol |
| `src/context/AuthContext.tsx` | `useAuth()` → `role`, `user.personalId` |

---

## FUERA DE ALCANCE

- Migración de `RolModulo`/`UsuarioModulo` legacy (deprecados, no se usan en nueva arquitectura)
- Permisos por usuario individual (override) - solo por rol en v1
- Tests automatizados (Vitest) - pendiente tarea separada
- Auditoría de cambios de permisos (bitácora) - pendiente

---

## NOTAS PARA LA IA IMPLEMENTADORA

1. **NO INVENTES PERMISOS** - Usa EXACTAMENTE los códigos del script SQL (`personal.crear`, `inventario.ajuste`, etc.)
2. **NO CAMBIES ARQUITECTURA** - El patrón `usePermisos()` + guards condicionales en JSX es obligatorio
3. **OWNERSHIP EN BACKEND** - La validación en `EmergenciaService` y `DonacionService` es INQUEBRANTABLE
4. **SEGURIDAD YA TIENE AccessDenied** - NO TOQUES `SeguridadPage.tsx` excepto la pestaña "permisos"
5. **BUILD DEBE PASAR** - `npm run build` y `dotnet build` sin errores al final de cada paso
6. **TYPESCRIPT ESTRICTO** - Sin `any`, tipos definidos en `src/types/` o inline
7. **VARIABLES CSS** - Colores solo via `var(--...)`, Tailwind solo layout
8. **UI PERMISOS LIMPIA** - En pestaña permisos, NO mostrar badge técnico `{permiso.codigo}` (ej. `emergencias.ver`, `inventario.ajuste`). Solo nombre legible (`permiso.nombre`) + descripción. Ver JSX actualizado en sección "FRONTEND — SeguridadPage: Pestaña Permisos Jerárquica".