# Plan de Mejoras — Módulo de Inventario

## Objetivo

Corregir y ordenar los flujos de trabajo del módulo de Inventario (Items, Movimientos, Equipo en Unidades e Insumos en Servicios), eliminando UI sin función y comportamientos ilógicos, **sin romper nada funcional existente**. El CRUD queda fuera de alcance; el foco es la lógica de flujo y la experiencia de uso.

## Alcance

Solo se modifican archivos del módulo de Inventario y sus integraciones directas con Donaciones:

- `src/app/pages/Inventario/InventarioPage.tsx`
- `src/app/pages/Inventario/MovimientosPage.tsx`
- `src/app/pages/Inventario/EquipoUnidadesPage.tsx`
- `src/app/pages/Inventario/ServicioInsumosPage.tsx`
- `src/app/pages/Donaciones/DonacionesPage.tsx` (solo retiro de botón Imprimir)
- `src/hooks/useInventario.ts`
- `src/services/inventarioService.ts`
- `src/types/inventario.ts`
- `Backend_Sub33/Backend_Sub33/Services/InventarioService.cs`
- `Backend_Sub33/Backend_Sub33/Services/DonacionService.cs`
- `Backend_Sub33/Backend_Sub33/Controllers/InventarioController.cs`
- `Backend_Sub33/Backend_Sub33/DTOs/Inventario/InventarioDtos.cs`

## Reglas

- No romper nada funcional existente.
- No agregar comentarios al código.
- Mantener estilos, componentes y convenciones del proyecto (variables CSS, `Modal`, `Drawer`, `Tabs`, `Badge`, `Button`, `Input`, `SelectField`).
- Cada fase debe compilar antes de continuar con la siguiente.
- Verificación final: `npm run build` y `dotnet build`, sin errores.

---

## Diagnóstico actual (flujos)

### Items — `InventarioPage.tsx`

- La sección **Proveedor** se muestra siempre, incluso cuando `origen === "Donado"`, donde no aplica porque el donante se registra en "Nueva Donación".
- El modal "Nueva Donación" genera un `noRecibo` aleatorio en el frontend, pero el backend ya lo genera si viene vacío (regla duplicada).
- El mismo modal no exige DPI/NIT ni teléfono, mientras que `DonacionesPage` sí los exige (reglas inconsistentes).
- Las pestañas **Kardex** y **Ubicaciones** del detalle de item muestran `EmptyState` vacíos: UI sin función.
- La pestaña **Acciones** duplica los botones del footer (Editar/Eliminar) y agrega "Imprimir".
- Los KPIs "Agotados" y "Stock bajo" navegan a Items sin aplicar filtro, por lo que el usuario no ve lo que el KPI indica.

### Movimientos — `MovimientosPage.tsx`

- El botón **"Registrar Movimiento"** permite crear ENTRADA/SALIDA/BAJA/AJUSTE manualmente, lo cual es ambiguo para una página que debe funcionar como kardex/bitácora.
- El backend interpreta AJUSTE como valor absoluto (`nuevoStock = dto.Cantidad`), lo que puede dejar el stock en un valor inesperado.
- `tipoMeta` incluye `TRANSFERENCIA`, que no existe en `cat_tipos_movimiento` (rama muerta).
- No se captura responsable; el backend lo deja opcional.
- El botón "Imprimir" usa `window.print()` e imprime toda la página, no el drawer.

### Equipo en Unidades — `EquipoUnidadesPage.tsx`

- Tabla plana sin agrupación: buscar la información de una unidad es desordenado.
- Solo se muestra el código de la unidad, no su nombre.
- El botón "Imprimir" usa `window.print()`.
- Editar reutiliza el alta (upsert); no hay validación de stock por suma de asignaciones.

### Insumos en Servicios — `ServicioInsumosPage.tsx`

- Es el patrón de diseño de referencia: banner de contexto + filtros + tarjetas agrupadas + Drawer con tabs.
- Único punto a limpiar: `window.print()`.

### Backend

- `CreateItemAsync` no registra movimiento ENTRADA cuando el item se crea con stock inicial (kardex incompleto).
- `CreateMovimientoAsync` permite tipos manuales y trata AJUSTE como absoluto; responsable opcional.
- `GetItemsAsync` no soporta filtro por estado de stock (bloquea KPIs filtrables).
- `GetEquipoUnidadesAsync` devuelve solo `unidad_codigo`; el nombre se resuelve en el frontend con `catalogos.unidades`.
- `DonacionService.MapearCategoria` mapea `"Equipo/Herramientas"` a `"Rescate"`, pero la categoría real es `"Equipo de Rescate"`.

---

## FASE 0 — Rediseño de "Equipo en Unidades" (tarjetas por unidad)

### Problema

La tabla plana actual no permite encontrar rápido la información de una unidad y no muestra el nombre de la unidad.

### Solución

Replicar el patrón visual de `ServicioInsumosPage`, agrupando por unidad en el cliente.

### Archivo

- `src/app/pages/Inventario/EquipoUnidadesPage.tsx` — reescribir completo.

### Diseño

1. Banner de contexto (como Insumos en Servicios) indicando que son equipos/insumos asignados por unidad.
2. Filtros:
   - Búsqueda por nombre de item.
   - Select de unidad (`catalogos.unidades`).
3. Grid de tarjetas por unidad:
   - Encabezado: icono `Truck` + **nombre** de la unidad + código.
   - Lista de items asignados (primeros 3): icono + nombre + cantidad con unidad de medida.
   - Footer: "X items asignados" + "N unidades en total" (suma de cantidades).
4. Click en tarjeta → `Drawer` con tab **"Unidad"**:
   - Grid de información de la unidad (nombre, código, items asignados, unidades en total).
   - Lista completa de items con cantidad y acción de **editar cantidad** por item.
5. Botón **"Asignar Equipo"** en la toolbar.
6. Mantener el modal de alta/edición existente (`asignarEquipo` hace upsert).

### Notas técnicas

- Cargar `loadEquipoUnidades()` sin filtro y filtrar por unidad en el cliente, para poder calcular la suma de asignaciones por item (Fase 3c).
- Resolver el nombre de la unidad con un `Map` desde `catalogos.unidades`; fallback a `unidadCodigo`.
- No requiere cambios de backend.

---

## FASE 1 — Correcciones críticas de lógica

### 1a. Ocultar Proveedor cuando origen = Donado

**Archivo:** `src/app/pages/Inventario/InventarioPage.tsx` (sección `CollapsibleSection label="Proveedor"`, línea ~617).

**Cambio:** envolver la sección en `{form.origen !== "Donado" && (...)}`.

### 1b. Corregir MapearCategoria en DonacionService

**Archivo:** `Backend_Sub33/Backend_Sub33/Services/DonacionService.cs` (línea ~59-67).

**Cambio:**

```csharp
private static string MapearCategoria(string? categoria)
{
    return categoria switch
    {
        "Insumos Médicos" => "Medicamentos",
        "Equipo/Herramientas" => "Equipo de Rescate",
        _ => "Otros Insumos"
    };
}
```

### 1c. Movimientos como Kardex de solo lectura + flujo Ajuste

**Archivo:** `src/app/pages/Inventario/MovimientosPage.tsx`.

**Cambios:**

- Eliminar el botón "Registrar Movimiento" y el modal de creación manual.
- Agregar botón **"Ajuste de Inventario"** que abre un modal con:
  - Item (obligatorio).
  - Tipo: solo `AJUSTE` (mostrado como fijo).
  - Cantidad: **delta con signo** (positiva suma, negativa resta), distinta de 0.
  - Motivo (obligatorio).
  - Responsable (obligatorio, tomado del usuario autenticado).
- Mostrar en el modal el stock actual y el stock resultante proyectado; advertir si quedaría negativo.
- La tabla queda como kardex de solo lectura: el click en fila solo abre el detalle.
- Mantener filtros y exportación CSV.

**Archivo:** `Backend_Sub33/Backend_Sub33/Services/InventarioService.cs` (`CreateMovimientoAsync`).

**Cambios:**

- Rechazar cualquier tipo distinto de `AJUSTE`.
- Exigir `ResponsableId`.
- Rechazar `Cantidad == 0`.
- Calcular `nuevoStock = item.StockActual + dto.Cantidad` (delta, no absoluto).
- Rechazar si `nuevoStock < 0`.

### 1d. Limpiar código muerto + registrar ENTRADA al crear item

**Archivo:** `src/app/pages/Inventario/MovimientosPage.tsx`.

- Eliminar el caso `TRANSFERENCIA` de `tipoMeta`.

**Archivo:** `Backend_Sub33/Backend_Sub33/Services/InventarioService.cs` (`CreateItemAsync`).

- Si `dto.StockActual > 0`, buscar el tipo `ENTRADA` e insertar un movimiento con motivo `"Stock inicial"`.

```csharp
if (dto.StockActual > 0)
{
    var tipoEntrada = await connection.QueryFirstOrDefaultAsync<int?>(
        "SELECT tipo_mov_id FROM cat_tipos_movimiento WHERE codigo = 'ENTRADA' LIMIT 1");
    if (tipoEntrada.HasValue)
    {
        await connection.ExecuteAsync(@"
            INSERT INTO inventario_movimientos (item_id, tipo_mov_id, cantidad, motivo, fecha_hora)
            VALUES (@ItemId, @TipoMovId, @Cantidad, @Motivo, CURRENT_TIMESTAMP);",
            new { ItemId = itemId, TipoMovId = tipoEntrada.Value, Cantidad = dto.StockActual, Motivo = "Stock inicial" });
    }
}
```

---

## FASE 2 — Completar funcionalidades pendientes

### 2a. Pestaña Kardex real en el detalle de item

**Archivo:** `src/app/pages/Inventario/InventarioPage.tsx` (pestaña "Kardex", línea ~442).

**Cambio:**

- Reemplazar el `EmptyState` por una tabla con los movimientos del item:
  - Cargar con `loadMovimientos({ itemId, pagina: 1, tamanio: 50 })` en un componente aislado (instancia propia del hook para no interferir con la tabla principal).
  - Columnas: Fecha, Tipo, Cantidad, Motivo, Responsable.
  - Reutilizar `tipoMeta`, exportándolo desde `MovimientosPage`.

### 2b. Pestaña Ubicaciones real en el detalle de item

**Archivo:** `src/app/pages/Inventario/InventarioPage.tsx` (pestaña "Ubicaciones", línea ~454).

**Cambio:**

- Reemplazar el `EmptyState` por dos secciones filtradas por `selectedItem.itemId`:
  - **En Unidades**: `equipoUnidades` + nombre de unidad desde `catalogos.unidades`.
  - **En Servicios**: `servicioInsumos` con número de servicio, paciente y cantidad.
- Cargar `loadEquipoUnidades()`, `loadServicioInsumos()` y `loadCatalogos()` en un componente aislado.
- Mostrar un `EmptyState` únicamente si ambas secciones están vacías.

### 2c. KPIs con filtros al navegar

**Archivo:** `src/app/pages/Inventario/InventarioPage.tsx`.

**Cambio:**

- Agregar estado `itemsFilter: "agotado" | "bajo" | null` en `InventarioPage` y pasarlo a `ItemsTab`.
- KPI "Items registrados" → Items sin filtro.
- KPI "Agotados" → Items con `stockStatus: "agotado"`.
- KPI "Stock bajo" → Items con `stockStatus: "bajo"`.
- KPI de movimientos → pestaña Movimientos.
- Mostrar un chip con el filtro activo y opción de quitarlo.
- Reiniciar la página a 1 al cambiar el filtro.

**Soporte backend (necesario para paginación correcta):**

- `InventarioDtos.cs`: agregar `public string? StockStatus { get; set; }` a `InventarioItemFiltrosDto`.
- `InventarioController.cs` (`GetItems`): agregar parámetro `stockStatus` y asignarlo al DTO.
- `InventarioService.cs` (`GetItemsAsync`):
  - `"agotado"` → `i.stock_actual <= 0`.
  - `"bajo"` → `i.stock_actual > 0 AND i.stock_actual <= i.stock_minimo`.
- `src/types/inventario.ts`: agregar `stockStatus?: string` a `InventarioItemFiltros`.
- `src/services/inventarioService.ts`: enviar `stockStatus` en los params.

### 2d. Asignar responsableId del usuario actual

**Archivo:** `src/app/pages/Inventario/MovimientosPage.tsx`.

**Cambio:**

- Obtener `user` con `useAuth()`.
- Enviar `responsableId: user?.personalId ?? null` en el DTO del ajuste.
- Si no hay `personalId`, bloquear el envío con un mensaje claro.

---

## FASE 3 — UX y robustez

### 3a. Unificar reglas de donación y NoRecibo

**Archivo:** `src/app/pages/Inventario/InventarioPage.tsx` (`handleCrearDonacionRapida`).

**Cambios:**

- Exigir DPI/NIT y teléfono del donante (igual que `DonacionesPage`).
- Eliminar la generación aleatoria de `noRecibo`; no enviarlo para que lo genere el backend.
- Marcar los campos como obligatorios (`*`) en el modal.

### 3b. Reemplazar window.print()

**Archivos y ubicaciones:**

- `InventarioPage.tsx`: pestaña Acciones (~línea 472) y footer del drawer (~línea 701).
- `MovimientosPage.tsx`: footer del drawer (~línea 295).
- `EquipoUnidadesPage.tsx`: footer del drawer (~línea 225).
- `ServicioInsumosPage.tsx`: footer del drawer (~línea 340).
- `DonacionesPage.tsx`: footer del drawer (~línea 215).

**Cambio:** eliminar los botones "Imprimir" que usan `window.print()` (imprimen toda la página, no el contenido del drawer). En Items, mover las acciones útiles de la pestaña "Acciones" al footer y eliminar la duplicación.

### 3c. Validación de stock por suma de asignaciones

**Archivo:** `src/app/pages/Inventario/EquipoUnidadesPage.tsx`.

**Cambio:**

- Calcular la suma de `cantidadAsignada` por `itemId` en todas las unidades (dataset completo, sin filtro de unidad).
- Comparar con `stockActual`.
- Mostrar advertencia visual ("Excede stock") en la tarjeta y en el drawer cuando la suma exceda el stock.

---

## Orden de ejecución

| Paso | Fase | Verificación |
|------|------|--------------|
| 1 | Fase 0 | `npm run build` + revisión visual de tarjetas/drawer |
| 2 | Fase 1 | `npm run build` + `dotnet build` |
| 3 | Fase 2 | `npm run build` + `dotnet build` |
| 4 | Fase 3 | `npm run build` + `dotnet build` |
| 5 | Final | Ambos builds sin errores |

## Pruebas funcionales manuales

1. Crear item con stock inicial → aparece movimiento `ENTRADA` en el Kardex.
2. Crear item con origen "Donado" → la sección Proveedor no se muestra.
3. En Movimientos no existe "Registrar Movimiento"; solo "Ajuste de Inventario".
4. Un ajuste con delta positivo/negativo actualiza el stock correctamente y no permite dejarlo negativo.
5. En Equipo en Unidades se ven tarjetas por unidad con nombre visible.
6. Click en una tarjeta → drawer con items asignados y edición de cantidad.
7. Crear donación Material desde Donaciones → el item se crea con categoría "Equipo de Rescate".
8. Detalle de item → pestañas Kardex y Ubicaciones con datos reales.
9. Click en KPI "Agotados"/"Stock bajo" → lista de Items filtrada y chip visible.
10. No existen botones "Imprimir" con `window.print()` en el módulo.

## Prompt para ejecución por IA

```
Implementa el plan docs/modulos/inventario/PLAN_INVENTARIO_MEJORAS.md en este orden:
Fase 0 → Fase 1 → Fase 2 → Fase 3.

Reglas:
- No romper nada funcional existente.
- Solo modificar archivos del módulo de Inventario y sus integraciones directas.
- Seguir exactamente las instrucciones del plan.
- No agregar comentarios al código.
- Verificar cada fase con npm run build y dotnet build.
- Al finalizar, ambos builds deben compilar sin errores.
```
