# Plan de Mejoras — Emergencias ↔ Vehículos (Ciclo de vida + Unidades destacadas)

> Fecha: **2026-10-20**
> Objetivo: el formulario de emergencia asigna vehículos reales de la flota (solo *Operativa + Activo*), con ciclo de vida de la emergencia (En proceso → Terminado → Inactivo) que retiene/libera la unidad automáticamente.

---

## Modelo de negocio acordado

### Estados de emergencia (3 estados)

| Estado | ¿Retiene unidad? | Visible en lista | Uso |
|--------|:-:|:-:|-----|
| `En proceso` | ✅ Sí | ✅ | Servicio activo, unidad destacada |
| `Terminado` | ❌ No | ✅ | Historial; unidad regresó a disponible |
| `Inactivo` | ❌ No | ❌ (filtrado) | Eliminación lógica; registro congelado |

**Migración de datos:** `UPDATE emergencias_servicios SET estado = 'En proceso' WHERE estado = 'Activo';`

### Ciclo automático de la unidad

| Acción | `vehiculo.estadoOperativo` | Validaciones |
|--------|----------------------------|--------------|
| **Crear** emergencia | → `"En Servicio"` | Vehículo existe, `estado='Activo'`, `estado_operativo='Operativa'`, y **no asignado a otra emergencia `En proceso`** |
| **Terminar** (`PATCH estado`) | → `"Operativa"` | Solo si el vehículo aún está `"En Servicio"`; si está en `"Mantenimiento"`, no se toca |
| **Desactivar** (`PATCH estado`) | **No se toca** | Solo permitido si el registro ya está `Terminado`; si no → `BadRequest` "Primero marque el servicio como Terminado" |

### Transiciones de estado (backend valida)

```
En proceso  →  Terminado   ✓  (libera unidad)
En proceso  →  Inactivo    ✗  "Primero marque el servicio como Terminado"
Terminado   →  Inactivo    ✓  (no toca unidad; solo oculta)
Inactivo    →  (ninguna)   ✗
```

### Disponibilidad — doble capa

1. **Select (frontend):** solo vehículos `Operativa + Activo`. Al editar, la unidad asignada actual se **anexa siempre** aunque ya no esté disponible.
2. **Backend:** al crear o cambiar unidad, valida existencia + disponibilidad + no duplicado en emergencias `En proceso`. Las `Terminado`/`Inactivo` no bloquean.

### Regla de eliminación lógica

- Para desactivar, el registro **debe estar `Terminado`** (la unidad ya quedó libre en ese paso).
- El `Inactivo` es un archivo: el registro queda tal cual (unidad incluida como histórico) pero **no retiene ni altera nada**.
- Un registro antiguo desactivado **nunca** bloqueará la asignación de esa unidad.

### Nombres de unidades

- Label del campo en el formulario: **"Unidad (es) destacada (s)"** (igual que el reporte físico).
- Opciones desde la flota; el nombre mostrado usa el campo que ya contiene los valores físicos (ej. *96, 240, 1419, Acuática*) — usar `noUnidad || codigo` con fallback `marca + ' ' + modelo`.
- El nombre denormalizado `unidad_asignada_nombre` guarda ese **mismo** valor (consistencia select / listado / filtro).

### Datos existentes

- `cat_unidades` **ya no** alimenta el formulario de emergencia (queda para Inventario).
- Backfill por placa: `cat_unidades.placa ↔ vehiculos.placa` para poblar `vehiculo_id` en registros antiguos.

---

## Fase 1 — Backend

### 1.1 Migración SQL — nuevo archivo `docs/modulos/emergencias/migracion_vehiculos_emergencias.sql`

```sql
-- 1) Columna de vínculo con la flota
ALTER TABLE emergencias_servicios
  ADD COLUMN IF NOT EXISTS vehiculo_id INT NULL
  REFERENCES vehiculos(vehiculo_id);

-- 2) Backfill por placa (registros antiguos que referencian cat_unidades)
UPDATE emergencias_servicios es
SET vehiculo_id = v.vehiculo_id
FROM cat_unidades cu
JOIN vehiculos v ON v.placa = cu.placa
WHERE es.unidad_asignada_id = cu.unidad_id
  AND es.vehiculo_id IS NULL
  AND cu.placa IS NOT NULL;

-- 3) Migración de estados: Activo → En proceso
UPDATE emergencias_servicios
SET estado = 'En proceso'
WHERE estado = 'Activo';
```

Se conservan `unidad_asignada_id` y `unidad_asignada_nombre` (legacy; el nombre ahora se rellena con el valor del vehículo).

### 1.2 DTOs

**`DTOs/EmergenciaCreateDto.cs`** — agregar:
```csharp
public int? VehiculoId { get; set; }
```
Se mantiene `UnidadAsignadaId` (legacy, no se envía desde el form nuevo). `UnidadAsignadaNombre` en create/update puede quedar opcional (lo resuelve el backend).

**`DTOs/EmergenciaUpdateDto.cs`** — mismo cambio: `+ VehiculoId`.

**`DTOs/EmergenciaResponseDto.cs`** y **`EmergenciaListItemDto`** — agregar `VehiculoId` a la respuesta (el listado puede omitirlo si no se usa).

### 1.3 `Services/EmergenciaService.cs`

**CreateAsync:**
1. `VehiculoId` **obligatorio** (reemplaza la obligatoriedad de `UnidadAsignadaId`).
2. Consultar vehículo:
   ```sql
   SELECT vehiculo_id, codigo, no_unidad, marca, modelo, estado, estado_operativo
   FROM vehiculos WHERE vehiculo_id = @VehiculoId
   ```
   - No existe → `BadRequest` "Vehículo no encontrado."
   - `estado <> 'Activo'` o `estado_operativo <> 'Operativa'` → `BadRequest` "El vehículo no está disponible para destacar (debe estar Activo y Operativa)."
3. Validar no duplicado:
   ```sql
   SELECT 1 FROM emergencias_servicios
   WHERE vehiculo_id = @VehiculoId AND estado = 'En proceso'
   LIMIT 1
   ```
   Si existe → `BadRequest` "El vehículo ya está asignado a otra emergencia en proceso."
4. Resolver nombre denormalizado: `no_unidad ?? codigo ?? ($"{marca} {modelo}")`.
5. En el INSERT: `vehiculo_id = @VehiculoId`, `unidad_asignada_nombre = @Nombre`, `unidad_asignada_id = NULL`, `estado = 'En proceso'`.
6. **Transacción:** después del INSERT exitoso:
   ```sql
   UPDATE vehiculos SET estado_operativo = 'En Servicio', updated_at = CURRENT_TIMESTAMP
   WHERE vehiculo_id = @VehiculoId AND estado = 'Activo'
   ```

**UpdateAsync:**
- Si `dto.VehiculoId` es null → comportamiento legacy (mantener lo que tenga el registro, o validar que no sea null si el registro original tenía unidad — preferible: requerir `VehiculoId` también en update).
- Si `VehiculoId` = el asignado actual (`es.vehiculo_id`) → permitir aunque ya no esté disponible (conserva referencia).
- Si cambia a otro vehículo → validaciones completas (disponible + no duplicado) como en create.
- Si cambia de unidad: liberar la anterior (si estaba "En Servicio" por este servicio → "Operativa") y asignar la nueva ("En Servicio"). Dentro de la misma transacción.
- Resolver nombre igual que en create.

**CambiarEstadoAsync (reemplazar implementación actual):**
```csharp
// 1) Cargar estado actual + vehiculo_id del registro
// 2) Validar transición:
//    - destino "Terminado": solo si actual == "En proceso"
//    - destino "Inactivo":  solo si actual == "Terminado"
//    - otro destino → BadRequest con mensaje de transición inválida
// 3) UPDATE estado
// 4) Si destino == "Terminado" y vehiculo_id != null:
//      UPDATE vehiculos SET estado_operativo = 'Operativa'
//      WHERE vehiculo_id = @VehiculoId AND estado_operativo = 'En Servicio'
//    (no toca si está en Mantenimiento)
// 5) Si destino == "Inactivo": no tocar vehículo
```
Mensajes de error sugeridos:
- Transición inválida: `"Transición de estado no permitida. Use: En proceso → Terminado → Inactivo."`
- Inactivo desde En proceso: `"Primero marque el servicio como Terminado antes de desactivarlo."`

**ObtenerPorIdAsync:** devolver `VehiculoId` además de `unidad_asignada_nombre`.

**Filtrado de listado:** si se pasa `estado` vacío, el listado principal podría excluir `Inactivo` por defecto — o mantener el filtro como está (el frontend ya filtra). Mantener comportamiento actual del filtro; el frontend gestiona qué muestra.

### 1.4 `Controllers/EmergenciasController.cs`

- El endpoint `PATCH {id}/estado` ya existe; solo asegurar que reciba el string y lo pase al service (ya lo hace).
- `POST` y `PUT` ya reciben los DTOs; no requieren cambios de firma.

### 1.5 `Models/Entities/EmergenciaServicio.cs` (opcional, consistencia)

- Agregar propiedad `VehiculoId` con `[Column("vehiculo_id")]` para que el modelo EF refleje la columna (el service usa Dapper, pero mantiene el modelo al día).

---

## Fase 2 — Frontend

### 2.1 `src/types/emergencia.ts`

- Agregar `vehiculoId?: number | null` a `Emergencia`, `EmergenciaCreate`, `EmergenciaUpdate`.
- Se mantiene `unidadAsignadaNombre` para display y `unidadAsignadaId` como legacy.
- Actualizar el type de estado si existe union type; si es `string`, documentar valores: `"En proceso" | "Terminado" | "Inactivo"`.

### 2.2 `src/services/emergenciaService.ts`

- Nuevo método:
  ```ts
  getVehiculosDisponibles: async (): Promise<Vehiculo[]> => {
    return apiClient.get<Vehiculo[]>("/vehiculos", {
      params: { estadoOperativo: "Operativa", estado: "Activo", pagina: 1, tamanio: 500 },
    });
  },
  ```
- Importar tipo `Vehiculo` desde `@/types/vehiculos`.

### 2.3 `src/hooks/useEmergencias.ts`

- En `cargarCatalogos()`: reemplazar la llamada a `getUnidades()` por `getVehiculosDisponibles()`.
- El estado de catálogos pasa a incluir `vehiculosDisponibles: Vehiculo[]` (elimina `unidades` de este hook; `tiposUnidad` sin uso se puede dejar).
- Ajustar el tipo del estado `catalogos` en consecuencia.

### 2.4 `src/app/pages/Emergencias/EmergenciaFormPage.tsx`

**Select de unidad (líneas ~1007-1043):**
- Label del campo: **"Unidad (es) destacada (s)"** (reemplaza "Unidad / Vehículo").
- Opciones desde `catalogos.vehiculosDisponibles`:
  ```tsx
  {catalogos.vehiculosDisponibles.map((v) => (
    <option key={v.vehiculoId} value={v.vehiculoId}>
      {v.noUnidad || v.codigo || `${v.marca} ${v.modelo}`}
    </option>
  ))}
  ```
- Estado: `const [vehiculoId, setVehiculoId] = useState("")` (reemplaza `unidadAsignadaId`).

**Modo edición (useEffect de carga):**
- Tras cargar la emergencia: `setVehiculoId(em.vehiculoId ? String(em.vehiculoId) : "")`.
- Si `em.vehiculoId` **no** está en `vehiculosDisponibles` → llamar `vehiculosService.getVehiculoById(em.vehiculoId)` (o `emergenciaService` si se agrega método) y **anexarlo** a las opciones (así no se pierde la referencia aunque ya no esté disponible).
- Etiqueta del anexo puede llevar indicador, ej. `(no disponible)`.

**Validación:** `if (!vehiculoId) newErrors.vehiculoId = true;` (obligatorio).

**Submit:**
- Crear: enviar `vehiculoId: Number(vehiculoId)`; no enviar `unidadAsignadaId`.
- Editar: enviar `vehiculoId: Number(vehiculoId)`.

### 2.5 `src/app/pages/Emergencias/EmergenciasPage.tsx`

**Filtro de unidad del toolbar (líneas ~1138-1146):**
- Cambiar de `catalogos.unidades` a `vehiculosDisponibles` (mismo hook).
- `value={v.noUnidad || v.codigo || String(v.vehiculoId)}` para que coincida con el nombre denormalizado guardado.
- Label visible igual que el form.

**Badge de estado (líneas ~799-800):**
- Actualizar para mostrar los 3 estados:
  ```tsx
  <Badge variant={emergencia.estado === "Terminado" ? "default" : emergencia.estado === "Inactivo" ? "outline" : "success"} dot>
    {emergencia.estado}
  </Badge>
  ```
  (Ajustar variant según los disponibles en `badge.tsx`.)

**Acciones de estado (líneas ~816-928):**
- Donde hoy solo hay "Desactivar" (que manda `"Inactivo"`), ofrecer:
  - Si `estado === "En proceso"`: botón **"Marcar como Terminado"** → `cambiarEstado(id, "Terminado")` + toast "Servicio terminado. Unidad liberada."
  - Si `estado === "Terminado"`: botón **"Desactivar"** (con `alert.confirm`) → `cambiarEstado(id, "Inactivo")` + toast.
  - Si `estado === "Inactivo"`: sin acciones.
- Refrescar lista + stats tras cada cambio (patrón actual).

**Detalle (`FieldRow` de estado, línea ~672):** el valor se muestra tal cual (`En proceso` / `Terminado` / `Inactivo`).

**Formulario físico hardcodeado (líneas ~465-468: 96/240/1419/Acuática):** fuera de alcance; no tocar.

---

## Fase 3 — Configuración

- **Sin cambios de código.** `cat_unidades` y su CRUD siguen para **Inventario** (`equipo_unidades`). El endpoint `/configuracion/catalogos/unidades` queda disponible; Emergencias deja de consumirlo.

---

## Fase 4 — Cierre y calidad

1. Convenciones estrictas: sin `any`, sin comentarios nuevos, `apiClient` (no fetch), `useAlert()` para confirm/toast, variables CSS + Tailwind solo layout, tipos de `src/types/*`.
2. Verificar builds:
   ```bash
   npm run build
   cd Backend_Sub33/Backend_Sub33 && dotnet build
   ```
   Backend debe quedar **detenido**. Si el exe bloquea el build:
   ```bash
   dotnet build -p:OutDir=C:\Users\PC\AppData\Local\Temp\opencode\bsout\
   ```
3. Actualizar `CONTEXTO.md`:
   - Módulo Emergencias: asignación de vehículos de la flota, ciclo En proceso → Terminado → Inactivo, auto-ciclo En Servicio/Operativa.
   - Migración `migracion_vehiculos_emergencias.sql`.
   - Regla: solo vehículos Operativa+Activo; no duplicado con emergencias En proceso.
   - `cat_unidades` queda solo para Inventario.

---

## Archivos a tocar (resumen)

| Archivo | Acción |
|---------|--------|
| `docs/modulos/emergencias/migracion_vehiculos_emergencias.sql` | **Nuevo** — columna `vehiculo_id` + backfill por placa + estados |
| `docs/modulos/emergencias/seed_vehiculos_reales.sql` | **Nuevo** — limpia prueba + siembra 96, 240, 1419, Acuática |
| `docs/modulos/emergencias/actualizar_codigos_vehiculos.sql` | **Nuevo** — Renombra códigos de vehículos activos a 96, 240, 1419, Acuática |
| `Backend.../DTOs/EmergenciaCreateDto.cs` | + `VehiculoId` |
| `Backend.../DTOs/EmergenciaUpdateDto.cs` | + `VehiculoId` |
| `Backend.../DTOs/EmergenciaResponseDto.cs` | + `VehiculoId` |
| `Backend.../Services/EmergenciaService.cs` | Create/Update con validaciones; CambiarEstado con transiciones + liberación de unidad |
| `Backend.../Models/Entities/EmergenciaServicio.cs` | + `VehiculoId` (consistencia) |
| `src/types/emergencia.ts` | + `vehiculoId`; documentar estados |
| `src/services/emergenciaService.ts` | + `getVehiculosDisponibles` |
| `src/hooks/useEmergencias.ts` | Catálogo de vehículos disponibles |
| `src/app/pages/Emergencias/EmergenciaFormPage.tsx` | Select "Unidad (es) destacada (s)" + edición con anexo |
| `src/app/pages/Emergencias/EmergenciasPage.tsx` | Filtro, badge 3 estados, acciones Terminar/Desactivar |
| `CONTEXTO.md` | Actualizar al cierre |

---

## Fase 5 — Datos: unidades reales (semilla)

Los vehículos registrados en la BD pueden ser datos de prueba que no coinciden con el formulario físico. Este paso alinea la flota con las unidades reales: **96, 240, 1419, Acuática**.

### Script: `docs/modulos/emergencias/seed_vehiculos_reales.sql`

1. Asegura tipos mínimos en `cat_tipos_vehiculo` (Autobomba, Ambulancia, Rescate, Acuática) si faltan.
2. Desactiva vehículos de prueba (`estado = 'Inactivo'`; soft delete, conserva histórico).
3. Siembra las unidades reales solo si no existen activas con ese `no_unidad`:
   - `no_unidad` y `codigo` = número del form (`96`, `240`, `1419`, `Acuática`).
   - `marca`/`modelo` = `"Por definir"` (se completan por UI en Vehículos después).
   - `estado_operativo = 'Operativa'`, `estado = 'Activo'`, `origen = 'Compra Propia'`, `kilometraje = 0`.
4. Verifica con SELECT de activos.

### Orden de ejecución de scripts (una sola vez en la BD)

```bash
# 1) Vínculo emergencias ↔ vehículos + migración de estados
psql ... -f docs/modulos/emergencias/migracion_vehiculos_emergencias.sql

# 2) Unidades reales del form físico (limpia prueba + siembra)
psql ... -f docs/modulos/emergencias/seed_vehiculos_reales.sql

# 3) Renombrar códigos de los vehículos activos a 96, 240, 1419, Acuática
psql ... -f docs/modulos/emergencias/actualizar_codigos_vehiculos.sql
```

> **Nota:** no existe seed oficial de la flota; estos scripts son para tener los números correctos de prueba. Marca, modelo, placa, año y kilometraje se editan después por UI en el módulo Vehículos.

---

## Fuera de alcance

- Formulario físico hardcodeado (96/240/1419/Acuática) en `EmergenciasPage`.
- UI de catálogos de `unidades` en Seguridad/Configuración.
- Relación Inventario ↔ vehículos.
- Paginación server-side de emergencias.
- Tests unitarios (pendiente global del proyecto).

---

## Verificación manual sugerida (post-implementación)

### Datos
1. Ejecutar ambos scripts SQL en orden (migración + seed).
2. Ejecutar actualizar_codigos_vehiculos.sql para renombrar códigos de vehículos activos a 96, 240, 1419, Acuática
3. En módulo Vehículos deben listarse activas: **96, 240, 1419, Acuática** (Operativa).
4. Completar marca/modelo/placa por UI cuando se tengan los datos reales.

### Ciclo emergencias ↔ vehículos
4. Crear emergencia seleccionando un vehículo Operativa → el vehículo debe pasar a "En Servicio" y desaparecer del select de nuevas emergencias.
5. Intentar crear otra emergencia con el mismo vehículo → debe rechazar con mensaje de duplicado.
6. Editar la primera emergencia → el vehículo asignado debe seguir visible en el select aunque esté "En Servicio".
7. Marcar "Terminado" → el vehículo debe volver a "Operativa" y reaparecer en el select.
8. Intentar "Desactivar" estando "En proceso" → debe rechazar.
9. Marcar "Terminado" y luego "Desactivar" → debe permitir; el vehículo no se toca; el registro se oculta de la lista.
10. Un vehículo en "Mantenimiento" o "Inactivo" no debe aparecer en el select de nuevas emergencias.
