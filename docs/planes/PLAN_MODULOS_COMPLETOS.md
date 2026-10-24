# PLAN MÓDULOS COMPLETOS — ProyectoSub33

> **Objetivo:** Llevar cada módulo a 100% (CRUD funcional, respuestas y acciones completas) en las 3 capas: **Frontend (React)**, **Backend (.NET 8)** y **Base de Datos (PostgreSQL)**.
> **Regla:** Fase por fase. Analizar cada módulo antes de tocar código. No crear nada a ciegas.
> **Última verificación:** 16/10/2026 (verificado leyendo el código fuente real, NO supuestos).

---

## 0. IMPORTANTE — CORRECCIÓN DEL ANÁLISIS PREVIO

El primer análisis (sesión anterior) estaba **desactualizado/incorrecto**. Al verificar el código real se confirmó:

- ❌ FALSO: "Inventario backend ausente" → **Inventario SÍ tiene backend completo** (Controller, Service, DTOs, Entity, DbSet, catálogos).
- ❌ FALSO: "Emergencias frontend usa mock / le faltan endpoints" → **Emergencias backend está completo** (POST/GET paginado/GET id/PUT/PATCH estado) y el **frontend usa API real**, sin mocks.
- ❌ FALSO: "faltan catálogos categorias-inventario / proveedores / tipos-movimiento" → **ya están en el whitelist** de `ConfiguracionController` (líneas 34-36).
- ✅ CIERTO: **Auth no tiene registro** (`POST /api/auth/register`).
- ✅ NUEVO (no detectado antes): **Finanzas, Vehículos y Reportes NO tienen backend** y su frontend usa estado local/vacío.

> Conclusión: el trabajo real es menor en Inventario/Emergencias y mayor en Finanzas/Vehículos/Reportes.

---

## 1. ARQUITECTURA Y UBICACIONES EXACTAS

| Capa | Ruta |
|------|------|
| **Backend Controllers** | `Backend_Sub33/Backend_Sub33/Controllers/` |
| **Backend Services** | `Backend_Sub33/Backend_Sub33/Services/` |
| **Backend DTOs** | `Backend_Sub33/Backend_Sub33/DTOs/<Modulo>/` |
| **Backend Entities** | `Backend_Sub33/Backend_Sub33/Models/Entities/` |
| **DbContext** | `Backend_Sub33/Backend_Sub33/Data/AppDbContext.cs` |
| **Migraciones** | `Backend_Sub33/Backend_Sub33/Migrations/` |
| **Frontend Pages** | `src/app/pages/<Modulo>/` |
| **Frontend Services** | `src/services/<modulo>Service.ts` + `src/services/api/client.ts` |
| **Frontend Hooks** | `src/hooks/use<Modulo>.ts` |
| **Frontend Types** | `src/types/<modulo>.ts` |

**Controladores existentes (12):** Auth, Catalogos, Configuracion, Donaciones, Emergencias, Inventario, Permission, Personal, Roles, Seguridad, WeatherForecast, ApiControllerBase.
**NO existen:** FinanzasController, VehiculosController, ReportesController.

**Convención de respuesta backend:** `ApiControllerBase.Respond()` → `ApiResponse.Ok/Fail` = `{ success, message, data }` (envelope).
**Convención frontend:** `apiClient` (fetch propio en `src/services/api/client.ts`, base URL `import.meta.env.VITE_API_BASE_URL`). Prohibido `fetch` directo, `any`, y URLs hardcodeadas.

---

## 2. TABLA RESUMEN — ESTADO REAL VERIFICADO

| Módulo | Backend | Frontend | BD | Estado | Qué falta |
|--------|:-------:|:--------:|:--:|:------:|-----------|
| **Auth** | ⚠️ Login | ✅ | ✅ | 90% | `POST /api/auth/register` |
| **Catálogos / Configuración** | ✅ | ✅ | ✅ | 100% | — |
| **Donaciones** | ✅ | ✅ | ✅ | 100% | — (verificar manual) |
| **Personal** | ✅ | ✅ | ✅ | 100% | Mejoras de rendimiento (ver `Mejoras.md`) |
| **Roles** | ✅ | ✅ | ✅ | 100% | — |
| **Seguridad (permisos)** | ✅ | ✅ | ✅ | 100% | — |
| **Emergencias** | ✅ | ✅ | ⚠️ drift | ~90% | Alinear físico↔impresión + `cat_estados_entrega` + drift de esquema (ver §3.4) |
| **Inventario** | ✅ | ✅ | ⚠️ | ~85% | Columnas `vencimiento`, `valor_unitario`, `estado` + lógica |
| **Finanzas** | ❌ | ⚠️ local | ❌ | 0% | Módulo completo (3 capas) |
| **Vehículos** | ❌ | ⚠️ local | ❌ | 0% | Módulo completo (3 capas) |
| **Reportes** | ❌ | ⚠️ vacío | ❌ | 0% | Endpoints de agregación + wire charts |

---

## 3. FASE 0 — VERIFICACIÓN Y CIERRE (Empezar aquí)

> Antes de construir nada nuevo, confirmar que lo que "parece completo" realmente funciona en runtime.

### 3.1 Auth — Registro (rápido, alto valor)
**Backend:** `Controllers/AuthController.cs`
- [ ] `POST /api/auth/register`: DTO `RegisterDto` (username, password, personalId?, rolId?)
- [ ] Validar username único, hash con BCrypt (ya usado en login), crear `Usuario` + `UsuarioRol`
- [ ] Respuesta con `AuthResponseDto` (reusa el existente)

**BD:** tabla `usuarios` existe → sin migración.

### 3.2 Emergencias — Verificación E2E (sin código nuevo si pasa)
> El detalle de la alineación con el formulario físico + drift de esquema está en **§3.4** (verificado 16/10/2026).
Backend ya tiene: `POST /`, `GET /` (paginado+filtros), `GET /{id}`, `PUT /{id}`, `PATCH /{id}/estado`, `GET /siguiente-incidente`.
- [ ] Registrar emergencia desde `RegisterServicePage` → verificar fila en BD
- [ ] Listar en `EmergenciasPage` → paginación y filtros server-side
- [ ] Editar en `EditServicePage` → PUT y reemplazo de relaciones (tipos, personal, signos)
- [ ] Cambiar estado Activo↔Inactivo
- [ ] Consumo de insumos descuenta stock y crea movimiento (integración con Inventario)

**Si todo pasa → Emergencias = 100%.** Si algo falla, documentar el fix puntual.

### 3.3 Inventario — Verificación E2E + columnas pendientes
Backend ya tiene: items CRUD paginado, movimientos (+ajuste de stock), equipo-unidades, servicio-insumos.
- [ ] Verificar CRUD de items, movimientos, equipo-unidades, servicio-insumos desde la UI
- [ ] Verificar catálogos (categorías, proveedores, tipos-movimiento)

**Gaps reales por decisión de diseño (confirmar con negocio si se requieren):**
- [ ] Columna `vencimiento` (DATE) — inventario perecedero/medicinas
- [ ] Columna `valor_unitario` (NUMERIC) — valorización
- [ ] Columna `estado` (VARCHAR con CHECK: Disponible/En Uso/Mantenimiento/Vencido/Baja)
- [ ] (si se agregan) actualizar: `InventarioItem.cs`, `AppDbContext.cs`, `InventarioDtos.cs`, `InventarioService.cs` (SELECT/INSERT/UPDATE), `src/types/inventario.ts`, formularios de `InventarioPage`
- [ ] Migración EF Core

### 3.4 Emergencias — Alineación con el Formulario Físico ✅ VERIFICADO (16/10/2026)

> **Meta:** que el sistema web **almacene igual que el formulario físico** para que al **imprimir** el reporte que ellos entregan, las casillas coincidan — **sin quitar las mejoras** ya agregadas al sistema web.
> **Método:** comparación campo a campo **físico ↔ web (`RegisterServicePage`) ↔ DTO back ↔ columna BD**. Verificación de BD hecha contra los scripts de esquema (no hay `psql`/Docker en el entorno; pendiente introspección en vivo si se desea).

#### A) Estado real de las tablas que usa el módulo

| Tabla | Definida en | Estado |
|---|---|---|
| `emergencias_servicios` | `Data/SQL/reset_db.sql:176` | ⚠️ le falta `unidad_asignada_nombre` (solo la agrega `emergencias_schema_fix.sql`) |
| `servicio_tipos_asistencia` | `reset_db.sql:225` | ✅ |
| `servicio_personal_asignado` | `reset_db.sql:234` | ❌ define `rol_en_servicio`; el código usa `rol_servicio_id` |
| `signos_vitales_paciente` | `reset_db.sql:246` | ✅ |
| `servicio_insumos_utilizados` | **no existe en ningún script** | ❌ el código inserta ahí (`EmergenciaService.cs:365`) |
| `cat_tipos_asistencia` | solo `docs/modulos/inventario/cat_tipos_asistencia.sql` | ⚠️ fuera del `reset_db` |
| `cat_roles_servicio` | **no se crea en ningún lado** | ❌ el código le hace JOIN (`EmergenciaService.cs:194`) |
| `cat_estados_entrega` | **no existe** | ❌ catálogo a crear |
| `cat_hospitales` | `reset_db.sql:51` | ⚠️ seed sin los hospitales del físico |
| `cat_unidades` | migración EF `20261003211500_CreateMissingTables` | ⚠️ códigos ≠ etiquetas del físico |
| `cat_tipos_emergencia` | `reset_db.sql:39` | ✅ |
| `configuracion_listas_maestras` | `reset_db.sql:8` | ✅ |

#### B) Mejoras del web a **CONSERVAR** (no están en el físico)
`genero`, `ubicacion` (ubicación del incidente, aparte del domicilio), `tipo_emergencia_id`, `estado_entrega`, `signos_vitales` (presión/FC/FR/SatO₂/hora_toma), `insumos_utilizados` (descuenta inventario), Nº de incidente automático.

#### C) Campos del físico que deben imprimirse **idénticos**
No. incidente · Solicitud (vía telefónica/personal) · Hora salida/entrada estación · Solicitante · Paciente(s) · Acompañante · Domicilio · Edad · Falleció (SI/NO) · **Asistencia (7)** · **Lugar de traslado (8)** · **Unidad(es) destacada(s)** (96/240/1419/Acuática/854 incendios + descripción) · Piloto(s) · Camillero(s) · Formulado por + firma · Vo.Bo. Jefatura · Lugar y fecha · Resumen.

#### D) Decisiones aprobadas
1. **Enfoque de mapeo:** guardar asistencia y lugar de traslado con el **texto canónico exacto del físico**; cualquier opción nueva del catálogo (mejora) cae en **"Otros Especifique" / "Otros"** al imprimir.
2. **Drift de personal:** usar **`rol_servicio_id`** + **crear/seedear `cat_roles_servicio`** (Piloto, Camillero, Socorrista…).
3. Por ahora: **solo actualizar este plan** (no código todavía).

#### E) Gaps que hoy rompen la impresión
1. **Asistencia:** BD guarda `"Accidente de tránsito"`/`"Accidente de trabajo"` (minúscula); `PrintForm` compara `"Accidente de Tránsito"`/`"Accidente de Trabajo"` (mayúscula) → casillas nunca se marcan (`EmergenciasPage.tsx:242-243`).
2. **Lugar de traslado:** faltan en `cat_hospitales` → *Hospitalito HOSMG, C.A.P, Clínica de especialidades Vida, Tecniscan Escuintla*; y el print usa `includes()` → falsos positivos ("Hospital Nacional de Antigua/Chimaltenango" marca Sololá).
3. **Unidad destacada:** el físico usa `96/240/1419/Acuática/854 incendios`; `cat_unidades` usa `A-33, B-12, R-5, U-22, U-33, BD-01…` → no coinciden.
4. **Año fijo** `"2026"` en `EmergenciasPage.tsx:471` → usar el año de `service.fecha`.

#### F) Tareas concretas
**BD (script idempotente `Data/SQL/emergencias_schema_fix.sql` extendido — NO destructivo):**
- [x] Agregar `unidad_asignada_nombre VARCHAR(150)` a `emergencias_servicios`.
- [x] `servicio_personal_asignado`: **agregar** `rol_servicio_id INT NULL` + FK `cat_roles_servicio` (se conserva `rol_en_servicio`).
- [x] Crear `cat_roles_servicio` + seed (Piloto, Camillero, Socorrista, Paramédico).
- [x] Crear `cat_estados_entrega` + seed (Estable, Delicado, Grave, Fallecido en traslado).
- [x] Crear `servicio_insumos_utilizados`.
- [x] Crear `cat_tipos_asistencia` + seed con el texto exacto del físico.
- [x] Agregar hospitales del físico a `cat_hospitales` (Hospitalito HOSMG, C.A.P, Clínica Vida, Tecniscan) conservando los existentes.
- [x] **Aplicado en BD `Sub_33`** (16/10/2026, vía `psql`): creada `cat_estados_entrega` + seed (Estable, Delicado, Grave, Fallecido en traslado). El resto de tablas/columnas ya existían. Endpoint `GET /api/configuracion/catalogos/estados-entrega` → **200 OK** (500 resuelto).
- [ ] Unificar los dos `reset_db.sql` (pendiente).
- [!] `cat_roles_servicio` contiene roles de **sistema** (Administrador, Secretario, Voluntario) en vez de roles de servicio (Piloto, Camillero, Socorrista). Afecta el "rol en servicio" y el Piloto/Camillero impreso. **Pendiente de decisión.**

**Backend:**
- [x] `ConfiguracionController` whitelist: `["estados-entrega"] = new("cat_estados_entrega","estado_entrega_id","nombre",true)`.
- [x] Completar wiring de `RolModulo` (`AppDbContext` DbSet + config + navegación en `Rol`) — el backend no compilaba por este WIP de Seguridad.
- [ ] (Opcional) validar `estado_entrega` contra el catálogo en `EmergenciaService`.

**Frontend:**
- [x] `RegisterServicePage`/`EditServicePage`: usan catálogo (`catalogos.estadosEntrega`) con fallback a las 4 opciones.
- [x] `configuracionService.ts`: `"estados-entrega"` en `CatalogoTipo`.
- [x] `emergenciaService.ts`: `getEstadosEntrega()`; `useEmergencias`: carga `estadosEntrega` (sin romper el resto si falla); `types/emergencia.ts`: `EstadoEntrega`.
- [x] `SeguridadPage.tsx`: "Estados de Entrega" en `CATALOGOS_OPCIONES`.
- [x] `EmergenciasPage.tsx` `PrintForm`: matching robusto (sin acentos/mayúsculas), coincidencia exacta en lugar de traslado (evita falsos positivos), extras → "Otros Especifique".
- [x] Corregir año fijo `2026` → `service.anio`.
- [x] `npm run build` y `dotnet build` en verde.

> **Nota:** la asignación de `cat_unidades` (códigos `A-33…`) a las etiquetas físicas (`96/240/1419/Acuática/854 incendios`) es un mapeo de negocio pendiente de confirmar; no se inventó un mapeo.

---

## 4. FASE 1 — FINANZAS (Módulo nuevo, 3 capas)

**Estado:** `FinanzasPage.tsx` funciona 100% en memoria (`INITIAL_DATA = []`). No hay backend ni tabla. Cerrar la pestaña pierde todo.

### 4.1 BD (PostgreSQL)
- [ ] Tabla `finanzas_transacciones`:
  `transaccion_id`, `fecha`, `tipo` (Ingreso/Gasto/Donación, CHECK), `descripcion`, `categoria`, `metodo_pago`, `comprobante`, `no_documento`, `monto` (numeric(12,2)), `responsable`, `estado` (Activo/Inactivo), `created_at`, `updated_at`
- [ ] Catálogo opcional `cat_categorias_finanzas`, `cat_metodos_pago` (o mantener enums)
- [ ] Índices: `fecha`, `tipo`

### 4.2 Backend
- [ ] Entity `FinanzaTransaccion.cs` + `DbSet` en `AppDbContext`
- [ ] DTOs en `DTOs/Finanzas/FinanzasDtos.cs` (Item, Create, Update, Filtros, Paginado)
- [ ] `IFinanzasService` + `FinanzasService` (Dapper, patrón igual a Inventario/Donaciones)
- [ ] `FinanzasController` (hereda `ApiControllerBase`): `GET` paginado+filtros, `GET /{id}`, `POST`, `PUT /{id}`, `PATCH /{id}/estado`, `DELETE /{id}`
- [ ] Migración EF Core

### 4.3 Frontend
- [ ] `src/types/finanzas.ts`
- [ ] `src/services/finanzasService.ts` (usar `apiClient`, envelope)
- [ ] `src/hooks/useFinanzas.ts`
- [ ] Refactor `FinanzasPage.tsx`: reemplazar estado local por hook (load/create/update/delete/changeEstado), paginación server-side
- [ ] KPIs y gráfico calculados desde datos del backend (o endpoint de resumen)

---

## 5. FASE 2 — VEHÍCULOS (Módulo nuevo, 3 capas)

**Estado:** `VehiculosPage.tsx` en memoria (`INITIAL_VEHICLES = []`, `INITIAL_FUEL = []`) y **datos de detalle hardcodeados** en `VEHICLE_DETAILS` (chassis, motor, mantenimientos, equipo). No hay backend.

### 5.1 BD
- [ ] `vehiculos`: `vehiculo_id`, `codigo`, `tipo`, `marca`, `modelo`, `placa`, `anio`, `color`, `kilometraje`, `estado_operativo` (Operativa/En Servicio/Mantenimiento), `origen` (estacion/donacion), `donacion_id?`, `estado`, timestamps
- [ ] `vehiculo_mantenimientos`: `mantenimiento_id`, `vehiculo_id`, `taller`, `tipo` (Preventivo/Correctivo), `fecha_ingreso`, `fecha_retorno`, `kilometraje`, `descripcion`, `costo`, `estado` (En proceso/Finalizado)
- [ ] `vehiculo_combustible` (cupones): `cupon_id`, `fecha`, `responsable`, `placas`, `tipo_unidad`, `galonaje`, `comision`, `gasolinera`, `cupon_del`, `cupon_al`, `total_cupones`, `valor_cupon`, `haber`, `saldo_restante`, `estado`
- [ ] `vehiculo_detalle` (o columnas): `chassis`, `motor`, `combustible`, `capacidad_tanque`, `condicion_llantas`, `seguro_hasta`
- [ ] Índices: `placa`, `codigo`

### 5.2 Backend
- [ ] Entities + `DbSet` (4)
- [ ] DTOs `DTOs/Vehiculos/`
- [ ] `IVehiculosService` + `VehiculosService` (Dapper)
- [ ] `VehiculosController`: CRUD vehículos, CRUD mantenimientos (cambia estado a "Mantenimiento"), CRUD combustible, `GET /{id}` con detalle completo
- [ ] Catálogos en `ConfiguracionController` si aplica: `tipos-vehiculo`, `talleres`, `gasolineras`
- [ ] Migración

### 5.3 Frontend
- [ ] `src/types/vehiculos.ts`, `src/services/vehiculosService.ts`, `src/hooks/useVehiculos.ts`
- [ ] Refactor `VehiculosPage.tsx`: flota, combustible y mantenimientos desde API
- [ ] **Eliminar `VEHICLE_DETAILS` hardcodeado** → cargar detalle real por `id`
- [ ] Integración con Donaciones cuando origen = donación

---

## 6. FASE 3 — REPORTES (Agregaciones, 2 capas)

**Estado:** `ReportesPage.tsx` tiene todos los datasets en `[]` (vacío) y `usuariosIniciales` hardcodeado. Filtros de módulo sin datos reales.

### 6.1 Backend
- [ ] `ReportesController` con endpoints de **solo lectura/agregación**:
  - `GET /api/reportes/resumen` (KPIs globales)
  - `GET /api/reportes/emergencias?desde&hasta&tipo&estado` (por tipo, tendencia mensual)
  - `GET /api/reportes/inventario` (distribución por categoría, items por categoría)
  - `GET /api/reportes/donaciones?desde&hasta` (tendencia, totales)
  - `GET /api/reportes/vehiculos` (combustible por unidad, costos mantenimiento)
  - `GET /api/reportes/personal` (por rol, estado)
- [ ] Sin tablas nuevas (consulta sobre tablas existentes con Dapper)

### 6.2 Frontend
- [ ] `src/services/reportesService.ts`
- [ ] Reemplazar arrays vacíos por fetch real según módulo/rango/filtros
- [ ] Export PDF/Excel real (hoy PDF = `window.print()`, Excel = solo toast)
- [ ] Quitar `usuariosIniciales` hardcodeado → usar `GET /api/configuracion/usuarios`

---

## 7. DEUDA TÉCNICA / CALIDAD (transversal, opcional)

Referencia: `Mejoras.md` (índices BD, N+1 en Personal, bloqueo optimista, race condition en crear usuario, debounce, React.memo, cache de peticiones, sincronización Configuración↔Personal).

- [ ] Índices de búsqueda (Personal, Usuarios, Inventario, Movimientos)
- [ ] Corregir código muerto en `ReportesPage` (filtro `modulo === "finanzas"` no existe en la unión `Modulo` → revisar/eliminar)
- [ ] `dotnet build` y `npm run build` sin errores al cierre de cada fase

---

## 8. ORDEN DE EJECUCIÓN RECOMENDADO

1. **Fase 0:** Auth register + verificación E2E Emergencias/Inventario (rápido, confirma base sólida).
2. **Fase 1:** Finanzas (módulo nuevo con mayor uso operativo).
3. **Fase 2:** Vehículos (incluye combustible, alto volumen).
4. **Fase 3:** Reportes (depende de que Finanzas/Vehículos tengan datos).
5. **Transversal:** Mejoras de rendimiento de `Mejoras.md`.

---

## 9. DEPENDENCIAS ENTRE MÓDULOS

```
FINANZAS    ← DONACIONES (tipo=Donación), VEHÍCULOS (combustible/mantenimiento)
VEHÍCULOS   ← DONACIONES (origen=donación)
REPORTES    ← FINANZAS, VEHÍCULOS, EMERGENCIAS, INVENTARIO, DONACIONES, PERSONAL
EMERGENCIAS → INVENTARIO (servicio_insumos_utilizados, movimiento USO_SERVICIO)
CATÁLOGOS   → TODOS (whitelist ConfiguracionController)
SEGURIDAD   → TODOS (permisos por rol/módulo)
```

---

## 10. VERIFICACIÓN POR FASE

```bash
# Backend
cd Backend_Sub33/Backend_Sub33
dotnet build
dotnet ef migrations add <Nombre>   # solo si hay cambios de BD
dotnet ef database update

# Frontend
npm run build     # 0 errores TypeScript
npm run dev       # prueba manual
```

**Criterio de "módulo 100%":** CRUD completo en UI reflejado en BD, respuestas `{success,message,data}` manejadas (éxito y error), acciones completas (crear, ver detalle, editar, cambiar estado, eliminar), paginación/filtros server-side, sin datos mock/hardcodeados, `dotnet build` + `npm run build` en verde.

---

## 11. CHECKLIST GLOBAL

- [ ] Fase 0 — Auth register
- [ ] Fase 0 — Verificación E2E Emergencias
- [ ] Fase 0 — Emergencias §3.4: alinear físico↔impresión (asistencia, lugar de traslado, unidades, año) + `cat_estados_entrega` + drift de esquema (`rol_servicio_id`/`cat_roles_servicio`, `unidad_asignada_nombre`, `servicio_insumos_utilizados`)
- [ ] Fase 0 — Verificación E2E Inventario (+ columnas si se aprueban)
- [ ] Fase 1 — Finanzas: BD + Backend + Frontend
- [ ] Fase 2 — Vehículos: BD + Backend + Frontend (eliminar `VEHICLE_DETAILS`)
- [ ] Fase 3 — Reportes: Backend agregación + Frontend wiring + export real
- [ ] Transversal — Mejoras de rendimiento (`Mejoras.md`)
- [ ] Build final: `dotnet build` + `npm run build` → 0 errores

---

*Fuente de verdad: código real leído el 16/10/2026. Actualizar este documento al cerrar cada fase.*
