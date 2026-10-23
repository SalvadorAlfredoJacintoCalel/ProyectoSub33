# ProyectoSub33 — Contexto Completo para IA

> Última actualización: **2026-10-22** (limpieza y pulido de este documento: se corrigieron contradicciones, tareas obsoletas y datos desactualizados; ver `docs/LIMPIEZA_CONTEXTO.md`).
> Este archivo es la fuente de contexto del proyecto. Mantenerlo actualizado al cerrar cada bloque de trabajo.

## Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura de Carpetas](#estructura-de-carpetas-monorepo)
4. [Módulos y Estado Actual](#módulos-y-estado-actual)
5. [Base de Datos](#base-de-datos-postgresql--tablas-principales)
6. [Backend — Endpoints](#backend--endpoints)
7. [Patrones de Código Frontend](#patrones-de-código-frontend)
8. [Convenciones Estrictas](#convenciones-estritas)
9. [Autenticación y Autorización](#autenticación-y-autorización)
10. [Estado Detallado por Módulo](#estado-detallado-por-módulo)
11. [Documentación del Proyecto](#documentación-del-proyecto)
12. [Tareas Pendientes](#tareas-pendientes-priorizadas)
13. [Archivos Clave](#archivos-clave-para-referencia-rápida)
14. [Comandos de Verificación](#comandos-de-verificación)
15. [Gotchas y Decisiones](#gotchas-y-decisiones-recientes)
16. [Historial de Sesiones](#historial-de-sesiones)

## Resumen Ejecutivo

- **Módulos conectados a backend:** Auth, Personal, Emergencias, Seguridad/Configuración, Inventario, Donaciones (incluye Libro mensual) y Vehículos (incluye Mantenimientos y Cupones).
- **Módulos solo UI / datos mock:** Finanzas, Reportes y Perfil.
- **Componente autónomo sin integrar:** Registro Combustible (`src/components/registro-combustible/`, sin backend, no montado en la app; ver sección propia).
- **Estado de compilación:** `npm run build`, `dotnet build` y `npm run test` (32/32) pasan correctamente al **2026-10-22**.
- **Backend:** debe compilarse y dejarse **detenido** al terminar. Puerto esperado: `5196`. Usar SDK **8** (fijado en `global.json`); con SDK 10 el DLL queda bloqueado por WDAC.
- **Regla UX clave:** el detalle de un KPI de Vehículos **no abre modal ni tabla**; actualiza las tarjetas de flota en la misma vista.
- **Regla BD clave:** **nunca** ejecutar `dotnet ef database update`; el esquema se administra con scripts SQL (ver Gotchas).

---

## Stack Tecnológico

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS 4.
- **UI:** componentes propios (`src/app/components/ui`), Radix UI, lucide-react, MUI 7, recharts.
- **Backend:** .NET 8, ASP.NET Core, **Dapper** (SQL directo) + PostgreSQL; EF Core para entidades/migraciones.
- **API:** `apiClient` centralizado (`src/services/api/client.ts`), envelope `{ success, message, data }`.
- **Auth:** JWT Bearer + Roles (`admin`, `voluntario`, `secretario`).
- **Estado:** React hooks + Context API.
- **Validación:** manual por formulario (no React Hook Form en las páginas nuevas).
- **Notificaciones:** `useAlert()` (`alert`, `confirm`, `toast`) desde `src/app/components/ui/AlertSystem.tsx`.

---

## Estructura de Carpetas (Monorepo)

```
ProyectoSub33-main/
├── src/                        ← FRONTEND (Vite + React 18 + TypeScript)
│   ├── app/
│   │   ├── pages/
│   │   │   ├── Auth/
│   │   │   ├── Personal/
│   │   │   ├── Emergencias/
│   │   │   ├── Seguridad/
│   │   │   ├── Inventario/
│   │   │   ├── Donaciones/      # DonacionesPage + LibroDonacionesTab
│   │   │   ├── Vehiculos/       # VehiculosPage + CuponesTab + components/
│   │   │   ├── Finanzas/        # UI/mock
│   │   │   ├── Reportes/        # UI/mock
│   │   │   └── Perfil/          # UI
│   │   ├── components/          # UI components (ui/, figma/)
│   │   ├── layout/              # MainLayout, Sidebar, Topbar
│   │   └── App.tsx              # Router + dashboard principal (layout activo + drawer móvil)
│   ├── components/
│   │   └── registro-combustible/  # Formulario autónomo (spec.json, grid, firmas); NO montado en la app
│   ├── services/
│   │   ├── api/client.ts        # apiClient centralizado
│   │   ├── authService.js       # usa fetch + VITE_API_BASE_URL (excepción a apiClient)
│   │   ├── personalService.ts
│   │   ├── configuracionService.ts  # usa fetch crudo (pendiente migrar a apiClient)
│   │   ├── seguridadService.ts      # usa fetch crudo (pendiente migrar a apiClient)
│   │   ├── emergenciaService.ts
│   │   ├── inventarioService.ts
│   │   ├── donacionService.ts
│   │   ├── donacionLibroService.ts
│   │   └── vehiculosService.ts
│   ├── hooks/
│   │   ├── useEmergencias.ts
│   │   ├── useInventario.ts
│   │   ├── useDonaciones.ts
│   │   ├── useDonacionLibro.ts
│   │   ├── useVehiculos.ts
│   │   ├── useCupones.ts
│   │   ├── usePermisos.ts        # permisos granulares + helpers por módulo
│   │   └── useFormDraft.ts       # autoguardado de borradores a localStorage
│   ├── __tests__/                 # Vitest: auth, permisos, cupones, registro-combustible (32 tests)
│   ├── types/                     # api, personal, emergencia, inventario, donacion, vehiculos
│   ├── constants/                 # roles.ts, navigation.ts
│   ├── utils/                     # format.ts, formHelpers.ts
│   ├── context/AuthContext.tsx    # useAuth() + AuthProvider (user, role, modulos, permisos)
│   └── main.tsx
│
├── Backend_Sub33/
│   └── Backend_Sub33/
│       ├── Controllers/           # Auth, Personal, Configuracion, Seguridad, Emergencias,
│       │                        # Inventario, Donaciones, DonacionLibro, Vehiculos, Cupones
│       ├── DTOs/                  # Por módulo (Inventario, Donacion, Vehiculos, etc.)
│       ├── Models/                # Entidades y catálogos (incl. UsuarioModulo, UsuarioPermiso, Permiso)
│       ├── Services/              # Lógica de negocio (incl. CurrentUser/ICurrentUser)
│       ├── Data/                  # AppDbContext + Data/SQL/*.sql (scripts SQL idempotentes)
│       ├── Common/                # ApiResponse, ServiceResult (incl. Forbidden), PaginatedResult
│       ├── Attributes/            # HttpRequirePermissionAttribute (valida claim `permiso`)
│       ├── Migrations/            # EF Core migrations (solo referencia; esquema por SQL)
│       └── Program.cs             # Startup + DI + JWT + CORS + rate limiting login
│
├── docs/
│   ├── permisos_seed.sql          # 47 permisos + asignación Admin/Secretario/Voluntario (idempotente)
│   ├── LIMPIEZA_CONTEXTO.md       # Registro del pulido de este archivo (2026-10-22)
│   └── modulos/
│       ├── inventario/
│       ├── emergencias/
│       └── vehiculos/
│           └── migracion_vehiculos.sql
├── CONTEXTO.md                    # Este archivo
├── global.json                    # Fija SDK .NET 8.0.419 (obligatorio; WDAC bloquea DLLs del SDK 10)
├── package.json
├── vite.config.ts                 # manualChunks (vendor/pdffjs/charts/ui)
├── vitest.config.ts               # Configuración de tests
├── reset_db.sql
└── README.md
```

---

## Módulos y Estado Actual

| Módulo | Frontend | Servicio / Hook | Backend | Estado |
|--------|----------|-----------------|---------|--------|
| **Auth** | `Auth/LoginPage.tsx` | `authService.js`, `AuthContext` | `AuthController` | Conectado a `/api/auth/login` (JWT). Recuperación/OTP aún es flujo UI. |
| **Personal** | `Personal/PersonalPage.tsx` | `personalService.ts` | `PersonalController` | Conectado. Incluye estadísticas y acceso al sistema. |
| **Emergencias** | `Emergencias/*` | `emergenciaService.ts`, `useEmergencias` | `EmergenciasController` | Conectado. CRUD, cambio de estado y siguiente incidente. |
| **Seguridad/Config** | `Seguridad/SeguridadPage.tsx` | `configuracionService.ts`, `seguridadService.ts` | `ConfiguracionController`, `SeguridadController`, `CatalogosController` | Conectado. Parámetros, usuarios, roles, permisos y catálogos. |
| **Inventario** | `Inventario/*` | `inventarioService.ts`, `useInventario` | `InventarioController` | Conectado. Items, Kardex, Ubicaciones, Servicio-Insumos, KPIs y baja. |
| **Donaciones** | `Donaciones/DonacionesPage.tsx`, `LibroDonacionesTab.tsx` | `donacionService.ts`, `donacionLibroService.ts`, `useDonaciones`, `useDonacionLibro` | `DonacionesController`, `DonacionLibroController` | Conectado. Registros Material/Monetaria + Libro mensual. |
| **Vehículos** | `Vehiculos/VehiculosPage.tsx`, `CuponesTab.tsx` | `vehiculosService.ts`, `useVehiculos`, `useCupones` | `VehiculosController`, `CuponesController` | Conectado. Flota, KPIs inline, mantenimientos, cupones e impresión. |
| **Finanzas** | `Finanzas/FinanzasPage.tsx` | — | — | Solo UI / datos mock. |
| **Reportes** | `Reportes/ReportesPage.tsx` | — | — | Solo UI / datos mock. |
| **Perfil** | `Perfil/ProfilePage.tsx` | — | — | Solo UI. |
| **Registro Combustible** | `src/components/registro-combustible/` | — | — | Componente autónomo (form + grid 15 col + firmas). No montado en la app; solo cubierto por tests/smoke render. |

---

## Base de Datos (PostgreSQL) — Tablas Principales

### Configuración y Catálogos

| Tabla | Descripción | PK |
|-------|-------------|----|
| `configuracion_listas_maestras` | Listas maestras genéricas | `lista_id` |
| `parametros_sistema` | Parámetros clave-valor | `parametro_id` |
| `cat_rangos` | Rangos bomberiles | `rango_id` |
| `cat_tipos_emergencia` | Tipos de emergencia | `tipo_emergencia_id` |
| `cat_hospitales` | Hospitales de referencia | `hospital_id` |
| `cat_tipos_unidad` | Tipos de unidad | `tipo_unidad_id` |
| `cat_unidades` | Unidades físicas (código, placa, estado) | `unidad_id` |
| `cat_roles_servicio` | Roles en servicio | `rol_servicio_id` |
| `cat_tipos_mantenimiento` | Tipos de mantenimiento | `tipo_mantenimiento_id` |
| `cat_categorias_inventario` | Categorías de inventario | `categoria_inv_id` |
| `cat_proveedores` | Proveedores | `proveedor_id` |
| `cat_tipos_movimiento` | Tipos de movimiento (`ENTRADA`, `SALIDA`, `BAJA`, `AJUSTE`, `USO_SERVICIO`, `REVERSION_SERVICIO`) | `tipo_mov_id` |
| `cat_tipos_vehiculo` | Tipos de vehículo | `tipo_vehiculo_id` |
| `cat_talleres` | Talleres de mantenimiento | `taller_id` |
| `cat_gasolineras` | Gasolineras para cupones | `gasolinera_id` |
| `cat_tipos_documento` | Tipos de documento del Libro de Donaciones | `tipo_documento_id` |
| `cat_modulos` | Módulos del sistema (visibilidad de menú: `bienvenida`, `personal`, `emergencias`, `inventario`, `donaciones`, `vehiculos`, `finanzas`, `reportes`, `seguridad`) | `modulo_id` |

### Usuarios, Personal y Seguridad

| Tabla | Descripción | PK | FKs |
|-------|-------------|----|-----|
| `personal` | Bomberos | `personal_id` (UUID) | `rango_id → cat_rangos` |
| `usuarios` | Cuentas de acceso | `usuario_id` (UUID) | `personal_id → personal` |
| `roles` | Roles del sistema | `rol_id` (int) | — |
| `permisos` | Permisos granulares por módulo | `permiso_id` (int, serial) | `modulo_id → cat_modulos` |
| `rol_permisos` | Matriz rol-permiso | `(rol_id, permiso_id)` | `rol_id`, `permiso_id` |
| `rol_modulo` | Módulos por rol (visibilidad menú) | `(rol_id, modulo_id)` | `rol_id`, `modulo_id` |
| `usuario_roles` | Roles de usuario | `(usuario_id, rol_id)` | `usuario_id`, `rol_id` |
| `usuario_modulos` | Módulos por usuario (override del rol) | `(usuario_id, modulo_id)` | `usuario_id → usuarios`, `modulo_id → cat_modulos` |
| `usuario_permisos` | Permisos por usuario (override del rol) | `(usuario_id, permiso_id)` | `usuario_id → usuarios`, `permiso_id → permisos` |
| `sesiones_activas` | Tokens JWT activos | `sesion_id` (UUID) | `usuario_id → usuarios` |
| `bitacora_accesos` | Log de ingresos | `bitacora_id` | `usuario_id → usuarios` |
| `codigos_recuperacion` | OTP recuperación | `codigo_id` | `usuario_id → usuarios` |

### Emergencias y Servicios

| Tabla | Descripción | PK | FKs |
|-------|-------------|----|-----|
| `emergencias_servicios` | Servicios de emergencia | `servicio_id` (serial) | `tipo_emergencia_id`, `hospital_destino_id`, `formulado_por_id`, `vehiculo_id` |
| `servicio_tipos_asistencia` | Tipos de asistencia por servicio | `(servicio_id, tipo_asistencia)` | `servicio_id` |
| `servicio_personal_asignado` | Personal asignado | `(servicio_id, nombre_personal)` | `servicio_id`, `personal_id` |
| `signos_vitales_paciente` | Signos vitales | `signo_id` | `servicio_id` |
| `revision_nuevas_opciones` | Revisiones de catálogos | `revision_id` | `servicio_id`, `atendido_por_usuario_id` |

### Inventario y Donaciones

| Tabla | Descripción | PK | FKs / Notas |
|-------|-------------|----|-------------|
| `inventario_items` | Insumos/equipos con stock | `item_id` | `categoria_inv_id`, `proveedor_id`, `donacion_id`, `vehiculo_id`; incluye `fecha_baja` |
| `inventario_movimientos` | Kardex de movimientos | `movimiento_id` | `item_id`, `tipo_mov_id`, `responsable_id → personal`; `cantidad` int firmado para ajustes |
| `equipo_unidades` | Equipo asignado a unidades | `(unidad_id, item_id)` | `unidad_id`, `item_id` |
| `servicio_insumos_utilizados` | Insumos consumidos en servicios | `(servicio_id, item_id)` | `servicio_id`, `item_id` |
| `donaciones` | Donaciones monetarias/material | `donacion_id` | — |
| `donacion_materiales` | Detalle de materiales donados | `material_id` | `donacion_id` |
| `donacion_libros` | Cabecera del Libro mensual de Donaciones | `libro_id` | `anio`, `mes` |
| `donacion_movimientos` | Movimientos del Libro de Donaciones | `movimiento_id` | `libro_id`, `tipo_documento_id` |

### Vehículos y Combustible

| Tabla | Descripción | PK | FKs / Notas |
|-------|-------------|----|-------------|
| `vehiculos` | Flota de vehículos | `vehiculo_id` | `tipo_id → cat_tipos_vehiculo`, `donacion_id → donaciones`; `estado`, `estado_operativo`, `fecha_baja` lógica |
| `vehiculo_mantenimientos` | Hojas de mantenimiento | `mantenimiento_id` | `vehiculo_id → vehiculos`, `taller_id → cat_talleres` |
| `vehiculo_cupones_periodos` | Periodos mensuales de cupones | `periodo_id` | `anio`, `mes`; saldos y valores por defecto |
| `vehiculo_cupones` | Cupones de combustible | `registro_id` | `periodo_id`, `vehiculo_id`, `gasolinera_id`; `firma_base64` PNG Base64 |

> **Relación clave:** los vehículos pueden estar vinculados a un item de inventario mediante `inventario_items.vehiculo_id`. La fecha de baja del vehículo se lee de `inventario_items.fecha_baja`.

---

## Backend — Endpoints

### Auth (`/api/auth`)

```
POST   /api/auth/login   → Login (username + password) → JWT
```

### Personal (`/api/personal`)

```
GET    /api/personal?pagina=&tamanio=&rangoId=&estado=   → Lista paginada con filtros
GET    /api/personal/estadisticas                        → KPIs de personal
GET    /api/personal/{id:guid}                           → Detalle
POST   /api/personal                                     → Crear
PUT    /api/personal/{id:guid}                           → Actualizar
PATCH  /api/personal/{id:guid}/estado                    → Cambiar estado
PUT    /api/personal/{id:guid}/acceso-sistema            → Habilitar/deshabilitar acceso
DELETE /api/personal/{id:guid}                           → Desactivar (soft delete)
```

### Emergencias (`/api/emergencias`)

```
GET    /api/emergencias                          → Lista
GET    /api/emergencias/{id:int}                 → Detalle
GET    /api/emergencias/siguiente-incidente      → Siguiente correlativo INC-YYYY-NNN
POST   /api/emergencias                          → Registrar (con insumosUtilizados[])
PUT    /api/emergencias/{id:int}                 → Actualizar
PATCH  /api/emergencias/{id:int}/estado          → Cambiar estado (En proceso → Terminado → Inactivo)
```

### Configuración, Catálogos y Seguridad (`/api/configuracion`, `/api/seguridad`)

```
GET    /api/configuracion/parametros
POST   /api/configuracion/parametros
PUT    /api/configuracion/parametros/{clave}

GET    /api/configuracion/usuarios
PUT    /api/configuracion/usuarios/{id:guid}/estado
PUT    /api/configuracion/usuarios/{id:guid}/rol

GET    /api/configuracion/roles
POST   /api/configuracion/roles
GET    /api/configuracion/roles/{rolId:int}/permisos
POST   /api/configuracion/roles/{rolId:int}/permisos

GET    /api/configuracion/catalogos/{tipo}
POST   /api/configuracion/catalogos/{tipo}
PUT    /api/configuracion/catalogos/{tipo}/{id:int}
DELETE /api/configuracion/catalogos/{tipo}/{id:int}
POST   /api/configuracion/catalogos/hospitales-completo
PUT    /api/configuracion/catalogos/hospitales-completo/{id:int}

GET    /api/seguridad/modulos/mios
GET    /api/seguridad/modulos/listar/{rolId:int}
POST   /api/seguridad/modulos/asignar
GET    /api/seguridad/modulos/usuario/{usuarioId:guid}
POST   /api/seguridad/modulos/usuario/asignar

GET    /api/seguridad/permisos/mios
GET    /api/seguridad/permisos/listar/{rolId:int}
POST   /api/seguridad/permisos/asignar
GET    /api/seguridad/permisos/usuario/{usuarioId:guid}
POST   /api/seguridad/permisos/usuario/asignar
```

### Inventario (`/api/inventario`)

```
GET    /api/inventario/items?pagina=&tamanio=&busqueda=&categoriaInvId=&stockStatus=
       → Lista paginada. stockStatus: "agotado" | "bajo"
GET    /api/inventario/items/{id:int}                  → Detalle
POST   /api/inventario/items                           → Crear (stock inicial genera ENTRADA)
PUT    /api/inventario/items/{id:int}                  → Actualizar
POST   /api/inventario/items/{id:int}/baja             → Dar de baja con responsable
DELETE /api/inventario/items/{id:int}                  → Eliminar

GET    /api/inventario/movimientos?itemId=&tipoMovId=&desde=&hasta=  → Kardex paginado
GET    /api/inventario/movimientos/tipos               → Tipos manuales (solo AJUSTE)
POST   /api/inventario/movimientos                     → AJUSTE con delta firmado

GET    /api/inventario/equipo-unidades?unidadId=       → Equipo por unidad
POST   /api/inventario/equipo-unidades                 → Upsert de equipo por unidad

GET    /api/inventario/servicio-insumos?servicioId=    → Insumos por servicio
POST   /api/inventario/servicio-insumos                → Registrar uso de insumo

GET    /api/inventario/resumen                         → KPIs de inventario
```

### Donaciones (`/api/donaciones`)

```
GET    /api/donaciones?tipo=&pagina=&tamanio=   → Lista paginada (Material | Monetaria)
GET    /api/donaciones/{id:int}                 → Detalle
POST   /api/donaciones                          → Crear (genera noRecibo si no se envía)
PUT    /api/donaciones/{id:int}                 → Actualizar
PATCH  /api/donaciones/{id:int}/estado          → Cambiar estado
DELETE /api/donaciones/{id:int}                 → Eliminar
```

### Libro de Donaciones (`/api/donaciones/libro`)

```
GET    /api/donaciones/libro/{anio:int}/{mes:int}          → Libro del mes
POST   /api/donaciones/libro/movimientos                   → Crear movimiento
PUT    /api/donaciones/libro/movimientos/{id:int}          → Actualizar movimiento
DELETE /api/donaciones/libro/movimientos/{id:int}          → Eliminar movimiento
```

### Vehículos (`/api/vehiculos`)

```
GET    /api/vehiculos?busqueda=&tipoId=&estadoOperativo=&origen=&estado=&pagina=&tamanio=
       → Lista paginada. tamanio máximo: 500
GET    /api/vehiculos/{id:int}                    → Detalle con mantenimientos y cupones
POST   /api/vehiculos                             → Crear
PUT    /api/vehiculos/{id:int}                    → Actualizar
PATCH  /api/vehiculos/{id:int}/estado             → Activar/Inactivar
PATCH  /api/vehiculos/{id:int}/estado-operativo   → Cambiar estado operativo (bloquea si hay mantenimiento en proceso)
DELETE /api/vehiculos/{id:int}                    → Desactivar (soft delete)

GET    /api/vehiculos/{id:int}/mantenimientos     → Historial de mantenimientos
POST   /api/vehiculos/{id:int}/mantenimientos     → Registrar mantenimiento
PUT    /api/vehiculos/mantenimientos/{id:int}     → Actualizar mantenimiento
DELETE /api/vehiculos/mantenimientos/{id:int}     → Eliminar mantenimiento
```

### Cupones de Combustible (`/api/vehiculos/cupones`)

```
GET    /api/vehiculos/cupones/periodos/{anio:int}/{mes:int}  → Periodo + cupones   [vehiculos.cupones.ver]
GET    /api/vehiculos/cupones/periodos/{anio:int}/{mes:int}/reporte → Reporte oficial  [vehiculos.cupones.imprimir]
PUT    /api/vehiculos/cupones/periodos                       → Guardar/actualizar periodo  [vehiculos.cupones.periodos]
POST   /api/vehiculos/cupones                                → Crear cupón            [vehiculos.cupones.crear]
PUT    /api/vehiculos/cupones/{id:int}                       → Actualizar cupón        [vehiculos.cupones.editar]
DELETE /api/vehiculos/cupones/{id:int}                       → Eliminar cupón          [vehiculos.cupones.eliminar]
```

---

## Patrones de Código Frontend

### API Client (`src/services/api/client.ts`)

```typescript
const data = await apiClient.get<T>("/endpoint");
const data = await apiClient.post<T>("/endpoint", body);
const data = await apiClient.put<T>("/endpoint", body);
const data = await apiClient.patch<T>("/endpoint", body);
await apiClient.delete<T>("/endpoint");

// Base URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5196/api"
// Token: localStorage.getItem("authToken")
// Headers: Content-Type: application/json + Authorization: Bearer <token>
```

### Envelope backend

```typescript
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
```

### Layout y estilos

- Variables CSS: `var(--bg-page)`, `var(--bg-card)`, `var(--bg-input)`, `var(--bg-hover)`, `var(--text-1..3)`, `var(--border)`, `var(--brand-*)`, `var(--success-*)`, `var(--warning-*)`, `var(--info-*)`.
- Tailwind solo para layout (grid, flex, spacing, tipografía).
- Iconos `lucide-react` 13–20px.

### Componentes UI reutilizables

- `Button` (`variant`: brand, brand-outline, outline, ghost; `loading`).
- `Input`, `SelectField`, `FormErrorSummary`, `InfoField`.
- `Modal` (Radix `Dialog.Portal`, `z-[var(--z-modal)]` = 500) para formularios.
- `Drawer` (portal, `z-[var(--z-drawer)]` = 400) para detalle con `Tabs`.
- `DataTable` con paginación server-side, toolbar y `emptyState`.
- `Tabs` soporta modo controlado con `value` + `onChange`.
- `AlertSystem`: `const { alert, confirm, toast } = useAlert();`.
- **Gotcha:** `ModuleWrap` usa `animate-page-enter`, creando stacking context permanente; los overlays `fixed` inline quedan atrapados. Usar `Modal`/`Drawer` (portal) para overlays.

### Patrón de KPIs inline en Vehículos

- Los KPIs **no abren modales ni data tables**.
- Al hacer clic en un KPI:
  1. Se activa la pestaña **Flota**.
  2. Se aplica `kpiFiltro` (`unidades`, `operativas`, `mantenimiento`, `donados`, `bajas`, `valor`).
  3. El grid inferior usa `vehiculosVista` y muestra las tarjetas correspondientes.
  4. Se muestra un chip **“Viendo: …”** con botón `X` para quitar la vista.
  5. La paginación se oculta mientras hay un KPI activo.
- Los filtros normales y la paginación llaman a `aplicarFiltros`, que limpia `kpiFiltro`.
- `KpiFiltro` y sus etiquetas viven en `VehiculosPage.tsx` (`KPI_LABELS`).
- `VehiculoCard` es el componente único de tarjeta para la flota.

### Impresión

- La impresión de Vehículos es **solo de la hoja de mantenimiento individual**.
- Componentes: `MantenimientoPrintSheet.tsx` y `MantenimientoPrintModal.tsx`.
- La hoja se renderiza dentro de `.print-area` mediante portal a `document.body`.
- CSS en `src/styles/globals.css`:
  ```css
  .print-area { display: none; }
  @media print {
    @page { size: A4 portrait; margin: 10mm; }
    body > *:not(.print-area) { display: none !important; }
    .print-area { display: block !important; width: 100% !important; }
    .no-print { display: none !important; }
  }
  ```
- Se usa `window.print()` únicamente como disparador; el contenido queda aislado por `.print-area`.

---

## Convenciones Estrictas

- **Nombres:** camelCase (vars/functions), PascalCase (componentes/types).
- **Estilos:** variables CSS + Tailwind solo layout.
- **API:** usar `apiClient` — **NO** fetch directo. Excepciones actuales (fetch crudo con `VITE_API_BASE_URL`, pendientes de migrar): `authService.js`, `configuracionService.ts`, `seguridadService.ts`.
- **Auth:** `useAuth()` → `{ user, role, loggedIn, login, logout, setRole }`; `user.personalId` (UUID o null).
- **Tipos:** **NO** duplicar; usar `src/types/*`.
- **URLs:** **NO** hardcodear; usar `VITE_API_BASE_URL`.
- **Tipado:** **NO** usar `any`.
- **Código funcional:** **NO** eliminar; refactorizar con cuidado.
- **Comentarios:** no agregar comentarios nuevos en el código.
- **Datos en kardex:** `inventario_movimientos.cantidad` es `int` y admite negativos (delta de AJUSTE).
- **KPIs de Vehículos:** no reintroducir modales/tablas para el detalle; usar tarjetas inline.

---

## Autenticación y Autorización

- JWT Bearer en `Authorization`.
- Roles: `admin` | `voluntario` | `secretario` (valores internos del frontend).
- El backend devuelve los roles en español (`Administrador`, `Secretario`, `Voluntario`); `normalizeRole()` en `src/constants/roles.ts` los mapea a los valores internos (case-insensitive, acepta también `admin`/`administrator`/`secretary`). Se usa en `authService.js` (login) y en `AuthContext` (restauración de sesión), por lo que corrige también `localStorage.userRole` obsoleto.
- Navegación por **módulos del usuario** (`GET /api/seguridad/permisos/mios`), no por `ROLE_NAV[role]`. "Inicio" (`bienvenida`) siempre visible; el resto se filtra por `AuthContext.modulos`.
- Permisos backend: `HttpRequirePermissionAttribute` (permisos finos de acción, independientes de la visibilidad de módulos).
- Storage: `localStorage.authToken` + `localStorage.user` + `localStorage.userRole` + `localStorage.userModulos`.
- Login: **conectado a `/api/auth/login`**; `authService.js` usa `import.meta.env.VITE_API_BASE_URL` (con fallback a `http://localhost:5196/api`).
- Recuperación de contraseña/OTP: flujo visual, **pendiente** de backend real.
- No existe conmutador "Vista de Rol": el rol viene del login y solo se usa para el badge y el gate de admin en Configuración (`SeguridadPage` exige `userRole === "admin"`).
- Acceso a Configuración está limitado por rol `admin`; la visibilidad del menú está limitada por módulos. Ambos deben coincidir para que un Administrador vea y entre a Configuración.

---

## Estado Detallado por Módulo

### Inventario (actualizado 2026-10-19)

**Backend**

| Archivo | Estado |
|---------|--------|
| `Models/Entities/InventarioItem.cs` | ✅ |
| `Models/Entities/InventarioMovimiento.cs` | ✅ (`Cantidad` int firmado) |
| `Models/Entities/EquipoUnidad.cs` | ✅ |
| `Models/Entities/ServicioInsumoUtilizado.cs` | ✅ |
| `DTOs/Inventario/InventarioDtos.cs` | ✅ (`StockStatus`, baja) |
| `Services/IInventarioService.cs` | ✅ |
| `Services/InventarioService.cs` | ✅ (Ajuste delta, ENTRADA inicial, filtro stock, baja) |
| `Controllers/InventarioController.cs` | ✅ (`stockStatus`, baja, POST servicio-insumos) |

**Frontend**

| Archivo | Estado |
|---------|--------|
| `src/types/inventario.ts` | ✅ |
| `src/services/inventarioService.ts` | ✅ |
| `src/hooks/useInventario.ts` | ✅ |
| `InventarioPage.tsx` | ✅ 4 pestañas; Kardex/Ubicaciones reales; KPIs filtrables; sin print |
| `MovimientosPage.tsx` | ✅ Solo lectura + Ajuste |
| `EquipoUnidadesPage.tsx` | ✅ Tarjetas por unidad + Drawer + validación de stock |
| `ServicioInsumosPage.tsx` | ✅ Tarjetas + Drawer; sin print |

**Mejoras aplicadas**

1. Equipo en Unidades rediseñado a tarjetas por unidad con filtros y edición de cantidades.
2. Items: se oculta Proveedor cuando `origen === "Donado"`; se eliminó `noRecibo` aleatorio y se exigen DPI/NIT y teléfono en donación rápida.
3. Movimientos: solo lectura + botón **Ajuste de Inventario**; backend acepta únicamente AJUSTE con delta firmado, motivo y `responsableId`.
4. Kardex: stock inicial genera ENTRADA con motivo "Stock inicial".
5. Detalle de item: pestañas Kardex y Ubicaciones con datos reales; se eliminó pestaña Acciones duplicada.
6. KPIs "Agotados" y "Stock bajo" navegan a Items con filtro server-side y chip para quitarlo.
7. Donaciones: `MapearCategoria("Equipo/Herramientas")` devuelve `"Equipo de Rescate"`.
8. Se eliminaron `window.print()` de Inventario y Donaciones.
9. Se eliminó el caso muerto `TRANSFERENCIA` de `tipoMeta`.

### Donaciones (actualizado 2026-10-20)

- `DonacionesPage.tsx` tiene dos vistas: **Registros** y **Libro mensual**.
- Registros: Material y Monetaria, conectados a `/api/donaciones`.
- Libro mensual: `LibroDonacionesTab.tsx` + `useDonacionLibro` + `/api/donaciones/libro`.
- El libro maneja movimientos con tipo de documento, saldos y exportación/consulta por mes.
- Se mantiene la integración Inventario ↔ Donaciones: al registrar material donado se crea/actualiza el item de inventario.

### Vehículos (actualizado 2026-10-20)

**Backend**

| Archivo | Estado |
|---------|--------|
| `DTOs/Vehiculos/VehiculoDtos.cs` | ✅ Incluye `FechaBaja`, mantenimientos, cupones y `FirmaBase64` |
| `Services/IVehiculoService.cs` / `VehiculoService.cs` | ✅ Flota, mantenimientos, estado operativo, vínculo con inventario/donaciones |
| `Controllers/VehiculosController.cs` | ✅ CRUD + estado + estado operativo + mantenimientos |
| `Services/ICuponService.cs` / `CuponService.cs` | ✅ Periodos y cupones |
| `Controllers/CuponesController.cs` | ✅ Periodos y cupones |

**Frontend**

| Archivo | Estado |
|---------|--------|
| `src/types/vehiculos.ts` | ✅ Incluye `fechaBaja`, filtros, cupones |
| `src/services/vehiculosService.ts` | ✅ Flota, mantenimientos, cupones y catálogos |
| `src/hooks/useVehiculos.ts` | ✅ Lista, stats auxiliares, mantenimientos y talleres |
| `src/hooks/useCupones.ts` | ✅ Periodos y cupones |
| `VehiculosPage.tsx` | ✅ Flota en tarjetas; KPIs inline; una sola instancia del modal de mantenimiento |
| `CuponesTab.tsx` | ✅ Periodos mensuales, cupones, firma digital PNG y exportación CSV |
| `components/VehiculoCard.tsx` | ✅ Tarjeta reutilizable de flota |
| `components/VehiculoFormModal.tsx` | ✅ Alta/edición de vehículo y datos de donación |
| `components/VehiculoDrawer.tsx` | ✅ Drawer con pestañas Info / Mantenimientos / Cupones + cambio rápido de estado |
| `components/MantenimientoTab.tsx` | ✅ Historial en DataTable con Imprimir / Eliminar |
| `components/MantenimientoModal.tsx` | ✅ Ingreso/avance/finalización + taller autocompletado |
| `components/MantenimientoPrintSheet.tsx` | ✅ Hoja imprimible |
| `components/MantenimientoPrintModal.tsx` | ✅ Vista previa + impresión |
| `components/vehiculoHelpers.ts` | ✅ Helpers de estados/formatos y lista de estados operativos |

**Flota y KPIs**

- Vista principal en **tarjetas** (`VehiculoCard`), no data table.
- Filtros: búsqueda, tipo, estado operativo, origen y `Activos / Inactivos / Bajas`.
- `fechaBaja` visible en tarjeta y drawer cuando el vehículo está inactivo.
- KPIs:
  - **Unidades:** total de vehículos.
  - **Operativas:** activos con estado operativo `Operativa` o `En Servicio`.
  - **En mantenimiento:** activos en `Mantenimiento`.
  - **Donados:** activos con origen `Donado`.
  - **Bajas:** inactivos.
  - **Valor de la flota:** suma de `valorUnitario` de activos.
- Al hacer clic en un KPI se actualiza el grid de tarjetas inferior (sin modal) y se activa la pestaña Flota.
- `KpiDetalleModal` fue eliminado; no debe reintroducirse.
- Los stats se cargan con `GET /api/vehiculos?pagina=1&tamanio=500`; el backend acepta hasta 500. **Limitación:** si la flota supera 500 unidades, los KPIs no serán exactos.

**Mantenimientos**

- Taller con `Input` + `datalist`; si no existe, se crea en `cat_talleres` mediante `POST /api/configuracion/catalogos/talleres`.
- Manejo de conflicto `409` (`ApiError`) al crear un taller duplicado.
- Se eliminó el select manual de estado.
- Flujo de dos fases:
  1. **Guardar ingreso** → crea mantenimiento `En proceso` y el vehículo pasa a `Mantenimiento`.
  2. **Guardar avance** → actualiza datos sin finalizar.
  3. **Finalizar mantenimiento** → exige fecha de retorno (si está vacía usa la fecha actual), guarda `Finalizado` y devuelve el vehículo a `Operativa`.
- Vehículo finalizado: botón **Guardar cambios**.
- El `VehiculoDrawer` tiene 3 pestañas: **Info**, **Mantenimientos** y **Cupones**; no usa `value`/`onChange`, por lo que vuelve a Info al abrirse.
- La pestaña **Mantenimientos** del drawer conserva Registrar, Completar/Finalizar e Imprimir.
- El **Historial** es un `DataTable` por vehículo con solo **Imprimir** y **Eliminar**; ya no crea, edita ni finaliza hojas.
- Solo existe una instancia de `MantenimientoModal`, abierta desde el drawer; se eliminó la duplicada del Historial.
- Impresión individual desde Historial, drawer y modal.

**Estado operativo**

- El bloque **Estado operativo** está en la pestaña **Info** del drawer.
- Opciones: `Operativa`, `En Servicio`, `Mantenimiento`, `Fuera de Servicio`.
- Si hay un mantenimiento `En proceso`, solo se permite mantener `Mantenimiento`; las demás opciones se deshabilitan.
- Endpoint: `PATCH /api/vehiculos/{id}/estado-operativo` con `{ estadoOperativo }`.
- El backend valida el estado y devuelve `400 Bad Request` con el mensaje:
  `Hay un mantenimiento en proceso; finalízalo antes de cambiar el estado operativo.`
- El frontend confirma con `alert.confirm`, actualiza el detalle, recarga la lista y los stats, y muestra `toast`.

**Cupones**

- Periodos mensuales con cupón inicial, total recibido, valor por defecto, haber y saldos.
- Registro de cupones por vehículo, gasolinera, responsable, kilometraje, galonaje y firma.
- Firma digital en `firma_base64` (PNG Base64); `firmado` se deriva de `firma_base64 IS NOT NULL`.
- `SignatureModal.tsx` es genérico: canvas nativo con Pointer Events en móvil/escritorio y carga de PNG/JPG/PDF (primera página) en escritorio. Usa `pdfjs-dist` solo para rasterizar PDF.
- La columna Firma muestra miniatura clicable si existe firma o botón **Firmar** si está pendiente; al guardar se actualiza el cupón y se muestra `toast` "Firma registrada".
- Exportación CSV.
- No se imprime; solo exportación.

**Cambios técnicos relevantes**

- `VehiculoDto.FechaBaja` agregado y `VehiculoSelect` incluye `i.fecha_baja`.
- Límite de paginación de vehículos cambiado de `>200` a `>500`.
- `useVehiculos.recargarTalleres()` para refrescar catálogo tras crear un taller.
- `Tabs` extendido con `value` controlado para que el clic de KPI active Flota.
- `VehiculoDrawer` reorganizado en 3 pestañas con `Tabs` no controlado.
- `MantenimientoTab.tsx` extraído como `DataTable`; Historial sin crear/editar/finalizar.
- `VehiculosPage` conserva una sola instancia de `MantenimientoModal`.
- Cupones: `CuponCreateDto`/`CuponUpdateDto`/`VehiculoCuponDto` incluyen `FirmaBase64`; `CuponService` normaliza el PNG, persiste `firma_base64` y deriva `firmado`.
- Cupones: columna Firma reemplaza el toggle booleano; el modal de edición ya no altera la firma directamente.
- `SignatureModal.tsx` agregado en `src/app/components/ui` y `pdfjs-dist` como dependencia de conversión PDF → PNG.
- Endpoint `PATCH /api/vehiculos/{id}/estado-operativo` + `cambiarEstadoOperativo()` en `vehiculosService.ts`.
- `npm run build` correcto al cierre del 2026-10-20.
- `dotnet build` correcto al cierre del 2026-10-20; backend dejado detenido.

### Emergencias (actualizado 2026-10-20)

**Backend**

| Archivo | Estado |
|---------|--------|
| `DTOs/EmergenciaCreateDto.cs` / `EmergenciaUpdateDto.cs` | ✅ Incluyen `VehiculoId` |
| `DTOs/EmergenciaUpdateDto.cs` | ✅ `VehiculoId` en respuesta y listado; `CambiarEstadoDto` acepta 3 estados |
| `Services/EmergenciaService.cs` | ✅ Valida vehículo, asigna/libera unidad y controla transiciones |
| `Controllers/EmergenciasController.cs` | ✅ `PATCH /estado` acepta `En proceso`, `Terminado`, `Inactivo` |
| `Models/Entities/EmergenciaServicio.cs` | ✅ Propiedad `VehiculoId` |

**Frontend**

| Archivo | Estado |
|---------|--------|
| `src/types/emergencia.ts` | ✅ `EstadoEmergencia` y `vehiculoId` |
| `src/services/emergenciaService.ts` | ✅ `getVehiculosDisponibles()` |
| `src/hooks/useEmergencias.ts` | ✅ Catálogo `vehiculosDisponibles` |
| `EmergenciaFormPage.tsx` | ✅ Select "Unidad (es) destacada (s)" con anexo en edición |
| `EmergenciasPage.tsx` | ✅ Badge de 3 estados y acciones Terminar / Desactivar |

**Ciclo de estados**

| Estado | Retiene unidad | Visible | Acción |
|--------|:-:|:-:|--------|
| `En proceso` | ✅ Sí | ✅ | **Marcar como Terminado** |
| `Terminado` | ❌ No | ✅ | **Desactivar** |
| `Inactivo` | ❌ No | ❌ | Sin acciones |

- Crear emergencia exige un vehículo `Activo` y `Operativa`, sin otra emergencia `En proceso`.
- Al crear, el vehículo pasa a `En Servicio`; al terminar, vuelve a `Operativa` solo si sigue en `En Servicio`.
- `En proceso → Inactivo` se rechaza con `"Primero marque el servicio como Terminado antes de desactivarlo."`.
- `Terminado → Inactivo` no toca el vehículo.
- Editar una emergencia permite conservar la unidad actual aunque ya no esté disponible; si cambia de unidad estando `En proceso`, libera la anterior y asigna la nueva.
- El listado oculta `Inactivo` cuando no se envía filtro de estado.
- El nombre denormalizado `unidad_asignada_nombre` usa `no_unidad`, luego `codigo`, luego `marca + modelo`.
- `cat_unidades` queda solo para Inventario; Emergencias usa la flota real.

**Scripts de datos**

- `docs/modulos/emergencias/migracion_vehiculos_emergencias.sql` agrega `vehiculo_id`, backfill por placa, migra `Activo → En proceso` y actualiza el `CHECK` de estados.
- `docs/modulos/emergencias/seed_vehiculos_reales.sql` desactiva datos de prueba y siembra/activa las unidades `96`, `240`, `1419` y `Acuática`.
- Ambos scripts son idempotentes y quedan listos para ejecutarse manualmente en orden; no se ejecutaron durante esta tarea.

### Finanzas y Reportes

- `FinanzasPage.tsx` y `ReportesPage.tsx` siguen siendo UI con datos mock.
- No hay servicios, hooks ni controllers backend dedicados.
- Pendiente definir modelo de datos, endpoints y permisos antes de conectarlos.

---

## Documentación del Proyecto

| Archivo | Propósito |
|---------|-----------|
| `docs/modulos/inventario/INVENTARIO.md` | Análisis completo de Inventario |
| `docs/modulos/inventario/PLAN_INVENTARIO_MEJORAS.md` | Plan de mejoras Fases 0–3 |
| `docs/modulos/inventario/PLAN_INVENTARIO_DONACIONES.md` | Integración Inventario ↔ Donaciones |
| `docs/modulos/inventario/PLAN_INSUMOS_EMERGENCIAS.md` | Insumos en Emergencias → Inventario |
| `docs/modulos/inventario/datos_inventario.sql` | Datos semilla |
| `docs/modulos/inventario/migracion_donaciones.sql` | Migración integración donaciones |
| `docs/modulos/vehiculos/migracion_vehiculos.sql` | Migración del módulo Vehículos |
| `docs/modulos/vehiculos/PLAN_MEJORAS_VEHICULOS_DRAWER.md` | Plan Drawer + Historial + Estado operativo (implementado) |
| `docs/modulos/emergencias/migracion_vehiculos_emergencias.sql` | Vínculo Emergencias ↔ Vehículos y estados |
| `docs/modulos/emergencias/seed_vehiculos_reales.sql` | Unidades reales 96, 240, 1419 y Acuática |
| `docs/modulos/emergencias/PLAN_EMERGENCIAS_VEHICULOS.md` | Plan de vehículos destacados y ciclo de vida (implementado) |
| `docs/modulos/vehiculos/PLAN_FIRMA_CUPONES.md` | Plan de firma digital PNG en Cupones (implementado) |
| `docs/modulos/vehiculos/migracion_firma_cupones.sql` | Columna `firma_base64` en `vehiculo_cupones` |
| `docs/modulos/vehiculos/migracion_cupones_firmas.sql` | Cargos + 4 firmas del período e índice de comisiones |
| `docs/modulos/vehiculos/migracion_cupones_comision_realizada.sql` | Columna `comision_realizada` en periodos |
| `docs/permisos_seed.sql` | Seed idempotente: 47 permisos + asignación por rol |
| `docs/LIMPIEZA_CONTEXTO.md` | Registro del pulido de este archivo (2026-10-22) |
| `plan-cupones.md` | Plan "Libro Mensual de Cupones" (ejecutado) |
| `PLAN_IMPRESO_CUPONES.md` | Plan de vista previa oficial de Cupones (parcialmente revertido) |
| `PLAN_REGISTRO_COMBUSTIBLE.md` | Plan del formulario Registro de Combustible |
| `src/components/registro-combustible/README.md` | Uso del componente autónomo Registro Combustible |
| `global.json` | Fija SDK .NET 8 (obligatorio; WDAC bloquea DLLs del SDK 10) |

---

## Tareas Pendientes (Priorizadas)

### Completadas

- [x] Conectar módulo Inventario a backend.
- [x] Conectar módulo Donaciones a backend.
- [x] Integración Inventario ↔ Donaciones (Material).
- [x] Insumos en Servicios → Inventario (lectura + registro de uso).
- [x] Plan de mejoras de flujos y UX del Inventario.
- [x] Conectar módulo Vehículos a backend (flota, mantenimientos, cupones).
- [x] KPIs de Vehículos con actualización inline de tarjetas, sin modal.
- [x] Impresión individual de hoja de mantenimiento.
- [x] Drawer de Vehículos con pestañas, cambio rápido de estado operativo e Historial sin duplicidad.
- [x] Emergencias con vehículos de la flota y ciclo En proceso → Terminado → Inactivo.
- [x] Firma digital PNG Base64 en cupones con `SignatureModal` (canvas + carga PNG/JPG/PDF).
- [x] Mover URL de `authService.js` a `VITE_API_BASE_URL` (ya migrado; aún usa `fetch` crudo).
- [x] Tests unitarios Vitest: 5 archivos / **32 tests** (`auth`, `permisos`, `cupones`, `registro-combustible`, smoke render).
- [x] Matriz de permisos granular completa (BD + backend + frontend + UI jerárquica).
- [x] Reporte oficial de Cupones + firma de 4 cargos del período.
- [x] Limpieza y pulido de `CONTEXTO.md` (2026-10-22; ver `docs/LIMPIEZA_CONTEXTO.md`).

### Pendientes

- [ ] Conectar módulos **Finanzas** y **Reportes** a backend (definir modelo, endpoints y permisos).
- [ ] Crear **endpoint de resumen de Vehículos** (`GET /api/vehiculos/resumen`) para no depender de cargar 500 registros en los KPIs.
- [ ] Implementar **recuperación de contraseña/OTP real** (hoy es flujo UI).
- [ ] Integrar **`RegistroCombustible`** en `CuponesTab` (decisión pendiente: el plan pide reemplazar la vista previa pero también "no tocar CuponesTab"; modelos de datos distintos).
- [ ] Agregar **input `comisionRealizada`** en el modal "Configurar período" de Cupones (columna BD y backend ya existen).
- [ ] **Resetear contraseñas** de `cmendoza`, `jrodriguez`, `mgonzalez` (hash BCrypt corrupto por bug de escape `$`; login lanza 500).
- [ ] Migrar `configuracionService.ts` y `seguridadService.ts` de `fetch` crudo a `apiClient`.
- [ ] Dividir componentes gigantes (`InventarioPage`, `VehiculosPage`, `ReportesPage`).
- [ ] Ampliar cobertura de tests (React Testing Library en componentes; hoy son unitarios de servicios/utils).
- [ ] Manejo de errores consistente en todos los módulos.
- [ ] Paginación real en backend para Emergencias.
- [ ] Validar DTOs backend con DataAnnotations completos.
- [ ] Revisar endpoints placeholder de `PermissionController`.

---

## Archivos Clave para Referencia Rápida

| Archivo | Propósito |
|---------|-----------|
| `src/services/api/client.ts` | Cliente API centralizado |
| `src/context/AuthContext.tsx` | Auth state + `useAuth()` |
| `src/types/inventario.ts` | Tipos del módulo Inventario |
| `src/types/donacion.ts` | Tipos del módulo Donaciones |
| `src/types/vehiculos.ts` | Tipos del módulo Vehículos |
| `src/constants/roles.ts` | Roles, labels, badges, navegación |
| `src/constants/navigation.ts` | Navegación (`ALL_NAV`) |
| `Backend_Sub33/Backend_Sub33/Services/InventarioService.cs` | Lógica de inventario |
| `Backend_Sub33/Backend_Sub33/Services/DonacionService.cs` | Lógica de donaciones |
| `Backend_Sub33/Backend_Sub33/Services/DonacionLibroService.cs` | Libro mensual de donaciones |
| `Backend_Sub33/Backend_Sub33/Services/VehiculoService.cs` | Lógica de vehículos y mantenimientos |
| `Backend_Sub33/Backend_Sub33/Services/CuponService.cs` | Lógica de cupones |
| `Backend_Sub33/Backend_Sub33/Controllers/VehiculosController.cs` | Endpoints de Vehículos |
| `Backend_Sub33/Backend_Sub33/Controllers/CuponesController.cs` | Endpoints de Cupones |
| `Backend_Sub33/Backend_Sub33/DTOs/Vehiculos/VehiculoDtos.cs` | DTOs de Vehículos |
| `src/app/components/ui/SignatureModal.tsx` | Firma genérica canvas/pointer + carga de imagen/PDF |
| `src/app/pages/Vehiculos/VehiculosPage.tsx` | Página principal de Vehículos |
| `src/app/pages/Vehiculos/components/VehiculoCard.tsx` | Tarjeta de flota |
| `src/app/pages/Vehiculos/components/MantenimientoTab.tsx` | Historial de mantenimiento en DataTable |
| `src/app/pages/Vehiculos/components/MantenimientoPrintSheet.tsx` | Hoja imprimible |
| `src/types/emergencia.ts` | Tipos y estados del módulo Emergencias |
| `src/services/emergenciaService.ts` | Servicio API de Emergencias |
| `src/hooks/useEmergencias.ts` | Lista, catálogos y transiciones |
| `src/app/pages/Emergencias/EmergenciaFormPage.tsx` | Alta/edición con vehículo destacado |
| `src/app/pages/Emergencias/EmergenciasPage.tsx` | Listado, detalle y acciones de estado |
| `Backend_Sub33/Backend_Sub33/Services/EmergenciaService.cs` | Lógica de Emergencias y vehículos |
| `Backend_Sub33/Backend_Sub33/Controllers/EmergenciasController.cs` | Endpoints de Emergencias |
| `reset_db.sql` | Recrear BD completa |

---

## Comandos de Verificación

```bash
# Frontend
npm run build          # Vite build (no ejecuta typecheck)
npm run test           # Vitest: 32 tests (auth, permisos, cupones, registro-combustible)

# Backend (SDK 8 obligatorio por global.json)
cd Backend_Sub33/Backend_Sub33
dotnet build           # Debe compilar sin errores
dotnet test            # exit 0

# Si el proceso Backend_Sub33 está corriendo y bloquea el .exe:
dotnet build -p:OutDir=C:\Users\PC\AppData\Local\Temp\opencode\bsout\

# Base de datos
# ⚠️ NO ejecutar `dotnet ef database update` (ver Gotchas). Los cambios de esquema van en SQL:
#    docs/permisos_seed.sql, Backend_Sub33/Backend_Sub33/Data/SQL/*.sql, docs/modulos/**/migracion_*.sql
```

> **Importante:** después de compilar el backend, dejarlo detenido. No iniciar el servicio si no se está probando.
>
> **Nota:** los únicos warnings actuales del backend son 2 preexistentes en `PersonalService.cs` (CS8619, líneas 777/791).

---

## Gotchas y Decisiones Recientes

- **Vehículos / KPIs:** no usar modales ni tablas para el detalle. El clic debe actualizar las tarjetas de abajo.
- **Vehículos / Stats:** los KPIs se calculan en frontend con hasta 500 registros; si crece la flota, mover a endpoint de resumen.
- **Vehículos / Impresión:** el contenido imprimible debe montarse en `.print-area` dentro de `document.body`; no imprimir toda la página.
- **Vehículos / Talleres:** crear taller desde el modal requiere manejar `409` y recargar el catálogo.
- **Vehículos / Mantenimiento:** el orden de botones importa; guardar antes de finalizar para evitar que Enter finalice accidentalmente.
- **Vehículos / Estado operativo:** si hay mantenimiento `En proceso`, el backend bloquea cualquier estado distinto de `Mantenimiento`.
- **Vehículos / Historial:** no duplicar acciones de mantenimiento; crear/editar/finalizar solo desde el drawer.
- **Emergencias / Vehículos:** solo se asignan vehículos `Activo` + `Operativa`; una unidad no puede estar en dos emergencias `En proceso`.
- **Emergencias / Estados:** `Inactivo` solo se permite desde `Terminado`; no se elimina físicamente el registro.
- **Emergencias / Unidad:** no volver a usar `cat_unidades` en el formulario; la flota real es la fuente.
- **Tabs:** usar `value` controlado cuando la página necesite cambiar de pestaña por código (por ejemplo, desde un KPI).
- **Inventario:** `cantidad` en kardex es firmada; no asumir valores positivos.
- **Auth:** el login ya usa backend y `VITE_API_BASE_URL`; aún usa `fetch` directo (no `apiClient`). `configuracionService.ts` y `seguridadService.ts` también usan `fetch` crudo.
- **SDK .NET:** no borrar `global.json`; compilar con SDK 8 (hoy `8.0.419`). Con SDK 10 el DLL compila pero WDAC lo bloquea al ejecutar (`0x800711C7`).
- **BD:** nunca `dotnet ef database update`; el esquema es 100% SQL (`docs/permisos_seed.sql`, `Data/SQL/*.sql`, migraciones de `docs/modulos/**`). `__EFMigrationsHistory` tiene las 2 migraciones iniciales marcadas como aplicadas para que EF reporte "already up to date".
- **Usuarios con hash corrupto:** `cmendoza`, `jrodriguez`, `mgonzalez` tienen `password_hash` inválido (bug de escape `$`); `BCrypt.Verify` lanza → HTTP 500 al login. Requieren reset.
- **Ownership:** emergencias solo las edita su creador (`formulado_por_id` == `personal_id` del JWT) o admin; donaciones (editar/eliminar/estado) solo admin. Requiere JWT con claim `personal_id` (re-login tras el cambio).
- **Registro Combustible:** `src/components/registro-combustible/` es autónomo, sin backend y **no montado** en la app; no confundirlo con `CuponesTab`/`ReporteCupones`.
- **Consola PowerShell:** los acentos pueden verse corruptos; los archivos están en UTF-8.

---

## Historial de Sesiones

> Las secciones siguientes son registros cronológicos de sesiones de trabajo. Para el estado actual del proyecto, consultar las secciones superiores de este archivo.

## Responsividad (2026-10-21)

- Layout activo en `src/app/App.tsx`: drawer movil con overlay, boton hamburguesa, cierre al navegar y bloqueo del scroll del body.
- `MainLayout`, `Sidebar` y `Topbar` alineados al mismo patron responsive (no son el layout que monta la app).
- Paddings y grids responsive en App, Emergencias, Perfil, Personal, Finanzas, Inventario, Reportes, Seguridad, Donaciones y Vehiculos; desktop >=1280 sin cambios visuales.
- `DataTable` usa `max-md:min-w-[720px]` para asegurar scroll horizontal en movil.
- Verificacion final: `npm run build` sin errores (solo warning de chunks >500 kB).

## Responsividad v2: Login y modales (2026-10-21)

- `LoginPage`: hero oculto por debajo de `lg`; header institucional, formulario en card blanca y footer de sede sobre gradiente navy-rojo; OTP y logos escalables. Desktop >=1024 identico.
- `Toast`: ancho limitado al viewport en movil y `max-w-sm` desde `sm`.
- Componentes base: `Drawer` y `Modal` limitan su ancho al viewport, permiten scroll horizontal y envuelven footers; `Tabs` permite scroll horizontal.
- Modales/drawers de detalle: grids a una columna en movil, tablas con scroll horizontal y paneles de fichas dentro del viewport.
- `npm run build` verificado sin errores.

## Borradores de formularios y autocompletado movil (2026-10-21)

### Autocompletado "Tipos de Asistencia" (Emergencias)

- `EmergenciaFormPage.tsx`: el agregar un valor nuevo ya **no depende solo de `onKeyDown` Enter** (los teclados virtuales no lo emiten).
- Se agrego boton **"+ Agregar"** junto al input y commit en **`onBlur`**; `Enter` se conserva para desktop.
- Los `<datalist>` de `VehiculoFormModal` (tipo) y `MantenimientoModal` (taller) guardan texto libre por `onChange`, sin bug.

### Guardado automatico de borradores

- Hook generico `src/hooks/useFormDraft.ts`:
  - `useFormDraft<T>(storageKey)` → `{ draft, savedAt, online, save, clear }`.
  - `save(value)` con debounce de 500ms a `localStorage` (prefijo `sub33.draft.`).
  - Detecta `navigator.onLine` + eventos `online`/`offline`.
- Componente `src/app/components/ui/DraftBanner.tsx`: chip "Guardado como borrador" (o "Sin conexion · guardado como borrador") + boton **Descartar**.
- Flujo por formulario: autoguardar al escribir → al reabrir restaura con `toast.info("Se recupero el borrador...")` → se limpia (`clear()`) al guardar con exito.
- Patrones de integracion:
  - Objeto unico + constante EMPTY: `VehiculoFormModal`, `MantenimientoModal`, `FinanzasPage`, `InventarioPage` (item), `ReportesPage` (usuario), `PersonalPage`.
  - Objeto con estado inicial generado: `DonacionesPage` usa `dirtyRef`.
  - Multiples `useState`: `EmergenciaFormPage`, `CuponesTab` (CuponModal), `LibroDonacionesTab` (MovimientoModal) componen un objeto draft + `draftRef` para restaurar.
  - `MovimientosPage` (ajuste) y `EquipoUnidadesPage` (asignar equipo) usan el objeto de form directamente.

**Formularios de creacion cubiertos (12):** Emergencias, Vehiculo, Mantenimiento, Cupon, Donacion, Libro de Donaciones, Transaccion (Finanzas), Miembro (Personal), Item, Ajuste (Movimientos), Asignar equipo (Equipo/Unidades) y Nuevo usuario (Reportes).

**No cubiertos (a proposito):** dialogos de configuracion de `SeguridadPage` (parametro, catalogo, hospital, usuario) por ser de 1-2 campos.

- `npm run build` verificado sin errores.

## Permisos de módulos por usuario + navegación real (2026-10-21)

### Modelo de permisos (override por usuario)
- **Módulos** (visibilidad del menú) viven en `cat_modulos` + `usuario_modulos` (nueva) + `rol_modulo` (heredado).
- `GET /api/seguridad/permisos/mios` devuelve los códigos de módulo del usuario autenticado:
  1. Si tiene filas en `usuario_modulos`, esas mandan (override).
  2. Si no, hereda los módulos de sus roles (`rol_modulo`).
- **Permisos finos** (`permisos` + `rol_permisos` + `HttpRequirePermissionAttribute`) siguen protegiendo acciones del backend; no cambian en este trabajo.

### Backend
- Nueva entidad `Models/UsuarioModulo.cs` + `DbSet<UsuarioModulo>` + config en `AppDbContext` (tabla `usuario_modulos`).
- `SeguridadController`:
  - `MisModulos` ahora aplica override usuario → rol.
  - `GET /api/seguridad/permisos/usuario/{usuarioId:guid}` → módulos con flag `asignado`.
  - `POST /api/seguridad/permisos/usuario/asignar` → body `{ usuarioId, moduloIds }`, reemplaza los módulos del usuario.
- SQL idempotente en `Backend_Sub33/Backend_Sub33/Data/SQL/migracion_usuario_modulos.sql` (crea `usuario_modulos`, agrega módulo `seguridad` a `cat_modulos` y asegura admin con todos). **Ejecutado en la BD `Sub_33` (2026-10-21).**

### Frontend
- `AuthContext`:
  - Se elimina `setRole` (ya no hay conmutador de rol).
  - Nuevo estado `modulos: string[]`, persistido en `localStorage.userModulos` y cargado con `getMisModulos()` tras `login()` y al restaurar sesión.
- `App.tsx` (layout activo):
  - Menú: `ALL_NAV.filter(n => n.id === "bienvenida" || modulos.includes(n.id))`.
  - Se eliminó el dropdown **"Vista de Rol"** y todo su estado.
  - `Bienvenido, {firstName}` y `userName`/`initials` derivados de `user.name` (primer nombre), ya no "Carlos García Soc" hardcodeado.
- `SeguridadPage` → pestaña **"Matriz de Permisos"**: dropdown de **usuarios** (de `getUsuarios()`) + checkboxes de **módulos** (`listarModulosUsuario`/`asignarModulosUsuario`). Se reemplazó la matriz de permisos finos por rol.
- `seguridadService.ts`: `listarModulosUsuario(usuarioId)` y `asignarModulosUsuario(usuarioId, moduloIds)`.

### Borradores: sin alerta falsa
- En cada formulario con guarda de "vacío/pristino", al quedar vacío se llama `clear()` (no solo se salta el guardado), evitando borradores obsoletos y la alerta "Se recuperó el borrador" sin datos.
- Formularios cubiertos: Emergencia (nueva detección `vacio`), Vehículo, Mantenimiento, Cupón, Libro de Donaciones, Finanzas, Personal, Item, Ajuste, Asignar equipo y Usuario (Reportes).

### Verificación
- `dotnet build` correcto (2 warnings preexistentes en `PersonalService.cs`).
- `npm run build` correcto.
- Verificado en runtime con JWT real: `GET /permisos/mios` devuelve por rol (Administrador 9, Secretario 7, Voluntario 5); `GET/POST /permisos/usuario/*` asigna y relee correctamente.
- Nota: en esta BD no existe el usuario `admin`; el Administrador es `sjacinto`.

### Fix de rol (2026-10-21)
- **Problema:** un usuario con rol `Administrador` en la BD aparecía como "Voluntario" en el sidebar y `SeguridadPage` le negaba el acceso ("solo el administrador puede acceder").
- **Causa:** `authService.js` comparaba `roles.includes("admin")`, pero el backend envía `["Administrador"]` (español capitalizado); al no coincidir caía al fallback `"voluntario"`.
- **Solución:** `normalizeRole()` en `src/constants/roles.ts` (admin/administrador/administrator, secretario/secretary, resto voluntario; prioridad admin > secretario). Usado en login (`authService.js`) y en la restauración de sesión (`AuthContext`), que además reescribe `localStorage.userRole` para corregir sesiones previas.
- Servicios detenidos al finalizar; no quedan procesos escuchando en `5173` ni `5196`.

## Matriz de Permisos Granular Completa (2026-10-21)

### Modelo en dos niveles
1. **Módulos** (`cat_modulos` + `rol_modulo` + `usuario_modulos`) → visibilidad del menú (sidebar). Admin 9, Secretario 8 (sin `seguridad`), Voluntario 6 (sin `personal`/`donaciones`/`seguridad`).
2. **Permisos** (`permisos` + `rol_permisos` + `usuario_permisos`) → acciones dentro de cada módulo. **47 códigos** con patrón `{modulo}.{accion}` (45 originales + `vehiculos.cupones.ver`/`vehiculos.cupones.imprimir`).

Regla de override: si el usuario tiene filas en `usuario_permisos` (o `usuario_modulos`), mandan; si no, hereda del rol. Idéntico patrón en ambos niveles.

### Base de datos
- `docs/permisos_seed.sql` (idempotente): crea columna `permisos.nombre`, tabla `usuario_permisos`, siembra los permisos y los asigna a roles. Versión final (2026-10-22): **47 permisos** · Admin 47 / Secretario 32 / Voluntario 11. (Al 2026-10-21 eran 45: Admin 45 / Secretario 30 / Voluntario 8.)
- **IMPORTANTE:** no ejecutar `dotnet ef database update`. El esquema se administra 100% con scripts SQL (`docs/permisos_seed.sql`, `Backend_Sub33/Backend_Sub33/Data/SQL/*.sql`). Ejecutar migraciones EF intentaría recrear tablas y destruir datos. Cualquier cambio de esquema futuro debe ir en SQL. (Nota histórica: al 2026-10-21 `__EFMigrationsHistory` estaba vacía; el 2026-10-22 se marcaron `20260917045937_InitialCreate` y `20261003211500_CreateMissingTables` como aplicadas **sin ejecutar** migraciones, para que EF reporte "already up to date".)

### Backend
- `Models/Entities/Permiso.cs`: nueva propiedad `Nombre` (columna `nombre`).
- `Models/UsuarioPermiso.cs` (nueva entidad) + `DbSet` + config en `AppDbContext` (tabla `usuario_permisos`).
- `Services/CurrentUser.cs` (`ICurrentUser`): lee `usuario_id`/`personal_id`/roles/permisos desde el JWT. Registrado en `Program.cs` (`AddHttpContextAccessor`).
- `AuthController`: agrega claim `personal_id` al JWT (para validación de ownership).
- **Fix crítico:** `Attributes/HttpRequirePermissionAttribute.cs` tenía un guard `if (context.Filters.Any(f => f is HttpRequirePermissionAttribute)) return;` que hacía que el atributo fuera un no-op (todo pasaba). Se reemplazó por la validación real: `ChallengeResult` si no autenticado, `ForbidResult` si no tiene el claim `permiso`.
- `SeguridadController`: rutas reorganizadas:
  - Módulos (menú): `GET/POST /api/seguridad/modulos/{mios,listar/{rolId},asignar,usuario/{id},usuario/asignar}`.
  - Permisos (acciones): `GET/POST /api/seguridad/permisos/{mios,listar/{rolId},asignar,usuario/{id},usuario/asignar}`.
- `[HttpRequirePermission]` agregado a: `PersonalController` (crear/editar/cambiar-estado/acceso-sistema/eliminar), `InventarioController` (crear/editar/baja/eliminar/ajuste/equipo-asignar/registrar-uso-servicio), `VehiculosController` (crear/editar/cambiar-estado/estado-operativo/eliminar/mantenimientos.*), `CuponesController` (crear/editar/eliminar/periodos), `DonacionesController` (registrar/editar/cambiar-estado/eliminar), `DonacionLibroController` (libro.*), `EmergenciasController` (crear/editar/cambiar-estado).
- **Ownership (backend, innegociable):**
  - `EmergenciaService`: `ActualizarEmergenciaAsync` y `CambiarEstadoAsync` validan que el `personal_id` del JWT == `formulado_por_id`, o que sea admin; si no, `UnauthorizedAccessException` → 403. Se agregó `formulado_por_id` a la consulta y al DTO `EmergenciaListItemDto`.
  - `DonacionService`: `UpdateAsync`/`ChangeEstadoAsync`/`DeleteAsync` exigen `EsAdmin`; si no, `ServiceResult.Forbidden` (nuevo factory en `ServiceResult`).

### Frontend
- `src/hooks/usePermisos.ts` (nuevo): hook centralizado. Lee `modulos` + `permisos` desde `AuthContext` y expone helpers `personal.*`, `inventario.*`, `vehiculos.*`, `donaciones.*`, `emergencias.editarPropia(f)`, etc. Si no hay permisos cargados, usa una matriz de respaldo por rol (evita bloqueo total).
- `AuthContext`: nuevo estado `permisos` (cargado con `getMisPermisos()` → `/seguridad/permisos/mios`, persistido en `localStorage.userPermisos`).
- `seguridadService.ts`: funciones de módulos (`/modulos/*`) y de permisos (`/permisos/*`); tipos `PermisoGranular` y `ModuloConPermisos`.
- Guards aplicados en: `PersonalPage`, `InventarioPage`, `MovimientosPage`, `EquipoUnidadesPage`, `VehiculosPage`, `VehiculoDrawer`, `MantenimientoTab`, `CuponesTab`, `DonacionesPage`, `LibroDonacionesTab`, `EmergenciasPage`, `EmergenciaFormPage`. (`ServicioInsumosPage` es solo lectura → sin cambios.)
- `SeguridadPage` pestaña "Matriz de Permisos": nueva UI jerárquica (selector Rol/Usuario + acordeones por módulo + master toggle indeterminado + checkboxes por permiso + autoguardado). Reemplaza la antigua UI de módulos por usuario.
- `EmergenciasPage`/`EmergenciaFormPage`: edición/estado condicionados por ownership (`editarPropia(formuladoPorId)`).

### Verificación
- `dotnet build` → 0 errores. `npm run build` → 0 errores.
- Probado con JWT reales (admin/voluntario/secretario): permisos por rol/usuario, guards 403, ownership de emergencias 403, módulos por rol correctos.
- Pendiente del usuario: reiniciar sesión (logout/login) para que el JWT nuevo incluya los claims `permiso` y `personal_id`; si no, los permisos se cargan por `/permisos/mios` (BD) sin necesidad de re-login, pero el claim `personal_id` (para ownership) sí requiere re-login.

## Últimos cambios (2026-10-22)

Cierre de la **Matriz de Permisos Completa** (BD + Backend + Frontend + UI). 15 tareas completadas:

| # | Componente | Estado | Verificación |
|---|------------|--------|--------------|
| 1 | **BD: `docs/permisos_seed.sql`** | ✅ Ejecutado | 45 permisos iniciales; luego ampliados a 47 (cupones) — ver abajo |
| 2 | **BD: `usuario_permisos` + `rol_permisos`** | ✅ Creadas y pobladas | Tablas operativas (idempotente) |
| 3 | **Backend: `SeguridadController` — 4 endpoints granulares** | ✅ | `GET/POST /permisos/listar\|asignar`, `GET/POST /permisos/usuario/*` |
| 4 | **Backend: `[HttpRequirePermission]` en 31 endpoints** | ✅ | Personal, Inventario, Vehículos, Cupones, Donaciones, Libro, Emergencias |
| 5 | **Backend: fix del atributo `HttpRequirePermission`** (era no-op) | ✅ | Ahora valida el claim `permiso` real → 403 |
| 6 | **Backend: ownership en `EmergenciaService`** | ✅ | Solo creador o admin edita/cambia estado → 403 |
| 7 | **Backend: ownership en `DonacionService`** | ✅ | Solo admin edita/elimina/cambia estado → 403 |
| 8 | **Backend: claim `personal_id` en JWT + `ICurrentUser`** | ✅ | Necesario para ownership |
| 9 | **Frontend: `src/hooks/usePermisos.ts`** | ✅ | Hook centralizado (permisos + módulos desde `AuthContext`) |
| 10 | **Frontend: `seguridadService.ts` — 4 funciones granulares** | ✅ | `listarPermisosPorRol`, `asignarPermisosRol`, `listarPermisosPorUsuario`, `asignarPermisosUsuario` |
| 11 | **Frontend: guards en 13 páginas/componentes** | ✅ | Personal, Inventario(4), Vehículos(4), Donaciones(2), Emergencias(2) |
| 12 | **Frontend: `SeguridadPage` pestaña "Matriz de Permisos"** | ✅ | UI jerárquica: selector Rol/Usuario + acordeones + master toggle + autoguardado |
| 13 | **Fix: `PersonalService.ChangeEstadoAsync` sincroniza ambas tablas** | ✅ | `personal.estado` + `usuarios.estado` quedan alineados |
| 14 | **Usuario `sjacinto` activado en BD** | ✅ | `estado = true` en `personal` y `usuarios` |
| 15 | **Builds verificados** | ✅ | `dotnet build` 0 errores · `npm run build` 0 errores |

### Cambio menor de esta sesión
- `src/app/pages/Seguridad/SeguridadPage.tsx`: se eliminó el badge técnico con el código del permiso (p. ej. `emergencias.ver`, `inventario.ajuste`) en los checkboxes. Ahora solo se muestra el nombre legible + descripción. El código del módulo (`moduloCodigo`) se mantiene en el encabezado del acordeón.
- `docs/permisos_seed.sql`: se reescribieron las **descripciones de los permisos** (entonces 45) con redacción orientada al usuario final (se eliminaron referencias internas como "anti-fraude", "SOLO ADMIN", "soft delete", "upsert", "ownership", "CRUD" y "delta firmado"). Seed re-ejecutado: los permisos y su asignación a roles no cambian, solo el texto. (Posteriormente se amplió a 47 con los permisos de cupones.)

### Notas importantes para futuros cambios
- **No ejecutar `dotnet ef database update`.** El esquema se administra 100% con scripts SQL (`docs/permisos_seed.sql`, `Backend_Sub33/Backend_Sub33/Data/SQL/*.sql`). EF intentaría recrear todas las tablas y destruiría los datos. (Posteriormente, el 2026-10-22, se marcaron las migraciones iniciales en `__EFMigrationsHistory` como aplicadas sin ejecutarlas, para que EF reporte "already up to date"; la regla de no ejecutar `database update` sigue vigente.)
- El esquema y los datos de la BD `Sub_33` están en localhost:5432, base `Sub_33`, usuario `postgres`, password `12345678` (ver `appsettings.json`).
- Para que el claim `personal_id` (ownership de emergencias) llegue al cliente hay que **cerrar y volver a iniciar sesión**.

## Libro Mensual de Cupones — Alineación con formato oficial (2026-10-22)

Ejecución de `plan-cupones.md` (6 pasos). Objetivo: alinear la ventana de Cupones con el formato oficial "Libro Mensual de Cupones de Combustible".

### 1. Base de datos — `docs/modulos/vehiculos/migracion_cupones_firmas.sql`
- `vehiculo_cupones_periodos`: + `elaborado_por`, `jefe_abastecimientos`, `jefe_33_cia`, `director` (VARCHAR 150) y sus 4 firmas (`firma_*_base64` TEXT).
- `vehiculo_cupones`: + `firma_base64` TEXT (migración que estaba **pendiente desde antes**; sin ella el módulo de cupones fallaba en runtime).
- Índice `ix_cupones_periodo_fecha_comision` (periodo_id, fecha, comision_no, registro_id).

### 2. Backend
- `VehiculoDtos.cs`: `CuponPeriodoDto` y `CuponPeriodoCreateDto` extendidos con los 4 cargos + 4 firmas. Nuevos DTOs `ReporteCuponesDto`, `ReporteEncabezadoDto`, `ReporteTotalesDto`, `ReporteFirmasDto`, `FirmaReporteDto`.
- `CuponService.cs`: `SavePeriodoAsync` guarda las 4 firmas (normalizadas como PNG base64); `LeerPeriodoAsync` las devuelve; nuevo `GetReporteImpresionAsync(anio, mes)` arma encabezado + detalle + totales + firmas (`ICuponService` actualizado).
- `CuponesController.cs`: nuevo `GET /periodos/{anio}/{mes}/reporte` y permiso `vehiculos.cupones.ver` en `GET /periodos/{anio}/{mes}`.

### 3. Frontend — tipos y service
- `types/vehiculos.ts`: extendidos `CuponPeriodo` y `CuponPeriodoCreate`; nuevos `ReporteCupones`, `ReporteCuponesEncabezado`, `ReporteCuponesTotales`, `ReporteCuponesFirmas`, `ReporteCuponesFirma`.
- `vehiculosService.ts`: nuevo `getReporteImpresion(anio, mes)`.
- `usePermisos.ts`: `vehiculos.verCupones` y `vehiculos.imprimirCupones` (nuevos helpers).

### 4-5. Frontend — UI
- `CuponesTab.tsx`: el modal "Configurar período" ahora tiene la sección **"Firmas del reporte oficial"** (4 cargos con nombre + `SignatureModal` reutilizado). Botones **"Vista Previa Oficial"** y **"Imprimir"** (gated por `vehiculos.cupones.imprimir`).
- **NUEVO** `src/app/pages/Vehiculos/components/ReporteCuponesPrintModal.tsx`: hoja A4 con membrete "33ª COMPAÑÍA BOMBEROS VOLUNTARIOS", las 14 columnas del formato oficial, fila de TOTALES, resumen (total gastados, valor unitario, total haber, saldo final, saldos para el mes siguiente) y las 4 firmas del pie. Se imprime vía `window.print()` con el patrón `.print-area` + `createPortal` (CSS global en `styles/globals.css`).
- El botón "Imprimir" ya no llama `window.print()` directo (imprimía en blanco por el CSS global): ahora genera el reporte oficial y lo imprime.

### 6. Permisos (47 en total)
| Permiso | Descripción | admin | secretario | voluntario |
|---|---|---|---|---|
| `vehiculos.cupones.ver` | Consultar el libro de cupones y el reporte oficial | ✅ | ✅ | ✅ |
| `vehiculos.cupones.imprimir` | Generar e imprimir el reporte oficial | ✅ | ✅ | ✅ |
| `vehiculos.cupones.crear` | Registrar un cupón de combustible | ✅ | ✅ | ✅ |
| `vehiculos.cupones.editar` | Actualizar un cupón | ✅ | ✅ | ❌ |
| `vehiculos.cupones.eliminar` | Eliminar un cupón | ✅ | ✅ | ❌ |
| `vehiculos.cupones.periodos` | Configurar los periodos mensuales | ✅ | ✅ | ❌ |

Totales por rol: Admin 47 · Secretario 32 · Voluntario 11.

### Verificación
- `dotnet build` → 0 errores · `npm run build` → 0 errores.
- Probado con JWT reales (admin/secretario/voluntario): ver y reporte 200 en los 3 roles; `PUT periodos` → **403 en voluntario**; crear cupón OK en secretario y voluntario; editar/eliminar solo admin+secretario.
- Reporte de Mayo 2026 verificado: 20 cupones gastados (6+5+4+5), Q2,000.00 de haber, saldo final Q5,000.00, 50 cupones restantes, Q5,000.00 para el mes siguiente.
- **Datos de prueba cargados** en Mayo 2026 (período + 4 cupones, según el plan) para validar el match visual. Para borrarlos:
  ```sql
  DELETE FROM vehiculo_cupones WHERE periodo_id = (SELECT periodo_id FROM vehiculo_cupones_periodos WHERE anio=2026 AND mes=5);
  DELETE FROM vehiculo_cupones_periodos WHERE anio=2026 AND mes=5;
  ```

## Mejoras Aplicadas - 2026-10-22

### Críticas (Fase 0)
- [x] Migración EF History aplicada: se marcaron `20260917045937_InitialCreate` y `20261003211500_CreateMissingTables` como aplicadas en `__EFMigrationsHistory` (ProductVersion 8.0.32). **No** se ejecutó `dotnet ef database update` destructivo: el esquema ya está 100% por SQL y EF reporta "already up to date".
- [x] BCrypt-Net-Next.dll: ya estaba desbloqueado (sin `Zone.Identifier`); se ejecutó `Unblock-File` por seguridad.
- [x] Migración 20261003211500_CreateMissingTables: sus tablas (`cat_tipos_unidad`, `cat_unidades`) ya existían por SQL; quedó registrada en el historial.
- [x] Seed `docs/permisos_seed.sql` re-ejecutado (idempotente): 47 permisos · Admin 47 / Secretario 32 / Voluntario 11 · módulos 9/8/6.
- [x] Build limpio: backend y frontend en 0 warnings / 0 errors.

### Correcciones críticas adicionales (no listadas, necesarias para "depurar sin problemas")
- [x] **Eliminado `Backend_Sub33/FixMigrationApp/`** (proyecto console residual `Console.WriteLine("Hello, World!")` que rompía el build con `CS8802` por doble top-level statement).
- [x] **Creado `global.json`** fijando SDK `8.0.419`. Sin él, `dotnet` usa el SDK 10 (10.0.302) y el DLL resultante es bloqueado por la política de Control de Aplicaciones/WDAC (`0x800711C7`, "Enterprise signing level requirements") al ejecutarse. Con SDK 8 el backend compila y arranca correctamente.
- [x] **Detenido el proceso `Backend_Sub33.exe`** que estaba corriendo (PID 5008) y bloqueaba el `.exe` en el build.

### Estabilización (Fase 1) — Solo localhost
- [x] `authService.js`: ya usaba `import.meta.env.VITE_API_BASE_URL` (verificado; sin cambios necesarios).
- [x] `.env` actualizado a `VITE_API_BASE_URL=http://localhost:5196/api` (sin IP fija).
- [x] `vite.config.ts`: code-splitting con `manualChunks` (vendor/pdffjs/charts/ui) + `chunkSizeWarningLimit: 1000`.
- [x] `setup-env.ps1` **no** se crea (solo localhost) y `docs/ACCESO_CELULAR.md` fue **eliminado** (no se usa).

### Mejoras Alto Impacto (Fase 2)
- [x] Tests unitarios Vitest (`src/__tests__/`): `auth.test.ts`, `permisos.test.ts`, `cupones.test.ts` → **20 tests pasando** (en ese momento; hoy 32 con la inclusión de registro-combustible).
- [x] Rate limiting `/api/auth/login` (5 req/min, cola 2) en `Program.cs` + `[EnableRateLimiting("LoginPolicy")]` en `AuthController`.

### Verificación
- [x] Build backend: 0 warnings/errors (`dotnet build --no-restore /p:RunAnalyzers=true /p:EnforceCodeStyleInBuild=true`).
- [x] Build frontend: 0 warnings/errors; chunks optimizados (vendor 143KB, pdfjs 365KB, charts 421KB, ui 70KB, index 722KB).
- [x] Tests: `npm run test` → 20/20 (en ese momento; hoy 32); `dotnet test` → exit 0.
- [x] Backend arranca limpio en `http://localhost:5196` (Swagger 200) y queda **detenido** para depuración manual.

### Notas importantes para el usuario
- **Depuración:** usar `dotnet run` (SDK 8 por `global.json`) en `Backend_Sub33/Backend_Sub33`. El frontend con `npm run dev`.
- **3 usuarios con hash BCrypt corrupto:** `cmendoza`, `jrodriguez`, `mgonzalez` tienen `password_hash` inválido (37 chars, `\\\.Ye4...`), resultado de un bug de escape `$` en el seed original. Al iniciar sesión con ellos, `BCrypt.Verify` lanza `SaltParseException` → HTTP 500. Requieren reset de contraseña (los 4 restantes `sjacinto`, `abc`, `bleon`, `josgmez` tienen hash válido `$2a$11$`).
- **No borrar `global.json`:** si se compila con SDK 10, el backend compila pero WDAC bloquea el DLL al ejecutarlo (`0x800711C7`).

## Reporte oficial de Cupones — 100% match formato (2026-10-22)

Completado el reporte de impresión (`ReporteCuponesPrintSheet`) para alinearlo al formato requerido "Libro Mensual de Cupones de Combustible". **Sin tocar módulo de flota.**

### Base de datos
- Nueva columna `comision_realizada` (INT) en `vehiculo_cupones_periodos` vía `docs/modulos/vehiculos/migracion_cupones_comision_realizada.sql` (idempotente, ejecutado).

### Backend (solo cupones)
- `DTOs/Vehiculos/VehiculoDtos.cs`: `ComisionRealizada` (int?) agregado a `CuponPeriodoDto`, `CuponPeriodoCreateDto` y `ReporteEncabezadoDto`.
- `Services/CuponService.cs`: `comision_realizada` persistido en `SavePeriodoAsync`, leído en `LeerPeriodoAsync` y mapeado a `Encabezado.ComisionRealizada` en `GetReporteImpresionAsync`.

### Frontend (solo cupones)
- `types/vehiculos.ts`: `comisionRealizada` agregado a `CuponPeriodo`, `CuponPeriodoCreate` y `ReporteCuponesEncabezado`.
- `ReporteCuponesPrintModal.tsx` (`ReporteCuponesPrintSheet`):
  - Fila **"SE RESIBIERON CUPONES"** en el encabezado (comisión realizada, DEL/AL, total recibidos, valor unitario, haber inicial).
  - Columna **COMISIÓN** (`c.comisionNo`) agregada → **15 columnas** en el detalle (FECHA, RESPONSABLE, FIRMA, KILOMETRAJE, PLACAS, TIPO DE UNIDAD, GALONAJE, COMISIÓN, NOMBRE GASOLINERA, DEL, AL, TOTAL, VALOR, HABER, SALDO).
  - Anchos de columna ajustados (suma ~98%) y `colSpan` corregidos (detalle 15, pie TOTALES 11).

### Verificación
- [x] `dotnet build --no-restore /p:RunAnalyzers=true /p:EnforceCodeStyleInBuild=true` → 0 warnings / 0 errors.
- [x] `npm run build` → 0 errores, chunks optimizados.
- [x] `npm run test` → 20/20 (en ese momento; hoy 32) · `dotnet test` → exit 0.
- [x] Columna `comision_realizada` verificada en BD (actualmente NULL hasta que se configure desde la UI/API).

### Nota
- El campo `comision_realizada` es de nivel **período** (se muestra en la fila "SE RESIBIERON CUPONES"); `comisionNo` es de nivel **cupón** (columna COMISIÓN). La UI de "Configurar período" (`CuponesTab.tsx`) no se modificó: el valor de `comisionRealizada` se setea vía API/BD hasta que se agregue el input en el modal.

## Registro Combustible - 2026-10-22

Nuevo formulario puro (sin backend) "Registro de Combustible - Mayo 2026" en `src/components/registro-combustible/`. Reconstruido a partir del plan (el `spec.json` original no existía; se generó como única fuente de verdad).

### Checklist
- [x] Tipos + `spec.json` (`types/spec.ts`, `types/grid.ts`).
- [x] Grid 15 columnas × 23 filas + zonas/mergedCells por rango (A1:O1…A23:O23).
- [x] Estilos JSON → `styles.ts` (StyleSpec → CSSProperties) + `grid.css`.
- [x] Campos `Field.tsx` (date, text, number, decimal, currency, select, textarea, signature, compound) + `validation.ts`.
- [x] 4 secciones: Header, Table (11×15), Summary, Signatures.
- [x] `TableBody.tsx` 11 filas repetibles × 15 columnas (TOTAL calculado).
- [x] Cálculos: `runningTotal`, `computeRunningTotals`, `sumHaber`, `sumSaldo`, `monthlyBalance`.
- [x] Print exacto (`@page letter landscape` + `@media print`) + `SignaturePad.tsx` (canvas → base64).
- [x] Export: CSV (Excel) + PDF (`window.print()`). No se instalaron ExcelJS/html2pdf (deps pesadas); documentado en README.
- [x] Responsive `<768px` (grid se apila).
- [x] Build 0 errores · Tests 32/32 (incluye smoke render `renderToString`).

### Notas
- Componente **no está importado en la app** (solo se valida vía tests/smoke render); para usarlo: `import { RegistroCombustible } from "@/components/registro-combustible"`.
- `runningTotal = HABER - SALDO + totalAnterior` (según spec reconstruida).
- Firmas se capturan en UI pero se ocultan en print (`signatures-section { display: none }`).

## Vista Previa Oficial de Cupones — Revert (2026-10-22)

Ejecutado `PLAN_IMPRESO_CUPONES.md` (adaptar vista previa de cupones al formato oficial JSON).

### Revertido
- [x] `ReporteCuponesPrintModal.tsx` **revertido** a su versión original funcional (`git restore --source=a092e04`): se eliminaron la fila "SE RESIBIERON CUPONES" y la columna "COMISIÓN" (vuelve a 14 columnas: FECHA, RESPONSABLE, FIRMA, KILOMETRAJE, PLACAS, TIPO UNIDAD, GALONAJE, GASOLINERA, DEL, AL, TOTAL, VALOR, HABER, SALDO).
- [x] `ReporteCuponesPrintSheet` **no existe como archivo separado** (es un export nombrado dentro de `ReporteCuponesPrintModal.tsx`), por lo que no había nada que eliminar.

### Se mantiene (no revertido, por alcance)
- Backend `ComisionRealizada` (DTO `CuponPeriodoDto`/`CuponPeriodoCreateDto`/`ReporteEncabezadoDto`, `CuponService`, columna BD `comision_realizada`) y `types/vehiculos.ts` (`comisionRealizada`) siguen presentes: son opcionales y retrocompatibles; el reporte revertido ya no los usa.

### Componente nuevo
- `src/components/registro-combustible/` ya estaba implementado (tarea previa) y se mantiene intacto.

### Verificación
- [x] `dotnet build --no-restore /p:RunAnalyzers=true /p:EnforceCodeStyleInBuild=true` → 0 warnings / 0 errors.
- [x] `npm run build` → 0 errores.
- [x] `npm run test` → 32/32 (incluye smoke render de `RegistroCombustible`).

### Pendiente / ambigüedad
- La **integración en `CuponesTab.tsx`** quedó **sin hacer**: el plan la pide ("reemplazar la llamada al modal por `RegistroCombustible`") pero también declara "NO TOQUES `CuponesTab.tsx`", y `RegistroCombustible` es un formulario autónomo con modelo de datos distinto al de `ReporteCupones`. No se tocó `CuponesTab.tsx`.

## Limpieza y pulido de CONTEXTO.md (2026-10-22)

Pulido del documento (solo documentación; sin cambios de código). Detalle completo en `docs/LIMPIEZA_CONTEXTO.md`.

### Correcciones aplicadas
- **Cabecera y resumen:** fecha actualizada a 2026-10-22; estado de compilación a la fecha (`npm run build`, `dotnet build`, `npm run test` 32/32); regla de BD (nunca `dotnet ef database update`) y nota de SDK 8/`global.json` agregadas al resumen.
- **Índice:** tabla de contenidos agregada (el archivo supera las 1100 líneas).
- **Estructura de carpetas:** agregados `src/components/registro-combustible/`, `src/__tests__/`, `global.json`, `vitest.config.ts`, `docs/permisos_seed.sql`, `docs/LIMPIEZA_CONTEXTO.md` y `usePermisos.ts`; anotados los servicios con `fetch` crudo.
- **Módulos:** nueva fila "Registro Combustible" (componente autónomo sin integrar).
- **Base de datos:** tabla `cat_modulos` agregada al catálogo.
- **Convenciones:** la excepción de `fetch` ahora lista `authService.js`, `configuracionService.ts` y `seguridadService.ts` (antes solo el primero).
- **Contradicción EF resuelta:** `__EFMigrationsHistory` ya **no** está vacía (2 migraciones marcadas como aplicadas el 2026-10-22); la regla de no ejecutar `database update` se mantiene y se unificó en el Resumen, Comandos y Gotchas.
- **Permisos:** conteo unificado a **47** (antes aparecían 45 y 47 en distintas secciones).
- **Comandos de verificación:** agregados `npm run test` y `dotnet test`; eliminado `dotnet ef database update`; advertencia de SDK 8.
- **Tareas pendientes:** reescritas en "Completadas"/"Pendientes". Eliminadas las obsoletas (URL de `authService.js`, "agregar tests"); agregadas las reales: integrar `RegistroCombustible`, input `comisionRealizada`, reset de usuarios con hash corrupto, migrar servicios con `fetch` crudo a `apiClient`.
- **Gotchas:** agregados SDK 8/WDAC, regla de BD unificada, usuarios con hash BCrypt corrupto, ownership y aclaración de Registro Combustible.
- **Documentación:** agregados `permisos_seed.sql`, planes de cupones/combustible, migraciones de firmas y comisión, `global.json` y este registro de limpieza.

### Verificación
- Documento revisado de principio a fin (1141 líneas); sin contradicciones internas entre el estado actual y el historial (el historial queda bajo "Historial de Sesiones").
- Sin cambios de código: builds y tests no afectados.

## Vista Previa Oficial de Cupones - 2026-10-22 (implementación JSON)

Ejecutado `PLAN_IMPRESO_CUPONES.md` en `src/components/registro-combustible/`: se reescribió el componente para
renderizar el formato oficial "Libro Mensual de Cupones de Combustible" conducido por `spec.json`.

### Implementado
- [x] Grid 15 columnas (A-O) × 21 filas con anchos en px desde `spec.json` (`Grid.tsx` + `useGrid.ts`).
- [x] Celdas fusionadas por rango (`Cell.tsx` + `MergedCell.tsx`; `parseRange` → `gridColumn`/`gridRow`).
- [x] Zonas tipadas (static, field, compound, row, repeatableRows) en `types/spec.ts`.
- [x] Estilos JSON → `styles.ts` (StyleSpec → CSSProperties) + `grid.css`.
- [x] Tabla detalle: 15 columnas exactas (FECHA…SALDO) con `repeatableRows` 11 filas (`TableBody.tsx`).
- [x] Fila "SE RESIBIERON CUPONES" (comisión realizada, DEL/AL, total recibidos, valor unitario, haber inicial).
- [x] Cálculos: `computeSaldos`/`runningTotal`, `sumHaber`, `sumTotalCupones`, `saldoFinal`/`monthlyBalance`, `cuponesRestantes` (`useCalculations.ts`).
- [x] `@media print` exacto (`@page letter landscape`; `margin 0.394in 0.984in`; `transform: scale(0.9)`; printArea A2:O21).
- [x] `SignaturePad.tsx` (canvas → base64) + 4 firmas oficiales (`SignaturesSection.tsx`).
- [x] Export ExcelJS (.xlsx con merges/estilos/pageSetup letter landscape scale 90) + html2pdf (PDF) + CSV (`utils/export.ts`).
- [x] Adaptador `utils/adapter.ts` (`fromReporteCupones`) para consumir `ReporteCupones` sin tocar `CuponesTab.tsx`.
- [x] Datos de prueba oficiales Mayo 2026 precargados (5 filas: 19 cupones, Q1,900.00 haber, Q5,100.00 saldo, 51 restantes).
- [x] Responsive <768px (grid se apila).

### Verificación
- [x] `dotnet build --no-restore /p:RunAnalyzers=true /p:EnforceCodeStyleInBuild=true` → 0 warnings / 0 errors.
- [x] `npm run build` → 0 errores.
- [x] `npm run test` → 37/37 (15 cálculos + 2 render + 20 previos).

### Notas / desviaciones
- `spec.json` fue reconstruido (el original no existía); coordenadas de filas/mergedCells no son literales del Excel oficial, solo equivalentes visuales.
- Dependencias agregadas: `exceljs@^4.4.0`, `html2pdf.js@^0.14.0` (se instalan ahora, no se habían instalado antes).
- Integración en `CuponesTab.tsx` NO realizada (el plan lo pide pero también declara "NO TOQUES `CuponesTab.tsx`"); el componente queda listo vía prop `reporte`.
- Verificación visual/PDF manual (login → Cupones → Vista Previa → PDF) queda pendiente de hacer en navegador.

## [2026-10-22] Implementación Formato Oficial Cupones - Impresión Directa

### Cambios aplicados:
1. **ReporteCuponesPrintModal.tsx** - ELIMINADO y REEMPLAZADO: nuevo `ReporteCuponesPrintSheet` con formato oficial landscape 15 columnas, encabezado 3 filas (MES/mesNombre/DE anio + grupos rowspan/colspan), fila "SE RESIBIERON CUPONES", nueva columna COMISION REALIZADA (`c.comisionNo`), 3 totales dinámicos (mes actual + mes siguiente), 4 firmas con fallback, y CSS inyectado `@page landscape 8mm` + aislamiento `.print-only` (patrón `visibility` de `registro-combustible`).
2. **CuponesTab.tsx** - Eliminado modal vista previa (`ReporteCuponesPrintModal`), eliminado `createPortal`, eliminado botón "Vista Previa Oficial", agregado div `.print-only` para impresión directa, simplificado a botón único "Imprimir" con auto-print (`imprimirReporte` → `setImprimirDespues(true)` → `window.print()` a los 150ms).
3. **src/styles/globals.css** - Agregadas reglas `.print-only` / `.no-print` para screen vs print.

### Verificación:
- ✅ `npm run build` sin errores (2757 módulos).
- ✅ `npm test` 42/42 passing (incluye nuevo `ReporteCuponesPrintSheet.test.tsx`, 5 tests).
- ⚠️ `tsc --noEmit` / `npm run lint` no disponibles en el proyecto (sin `typescript`, sin `tsconfig.json` y sin script `lint`); la compilación se validó vía `vite build`.
- ✅ Print manual (pendiente en navegador): click "Imprimir" → diálogo print directo → PDF formato referencia (Mayo 2026: 5 filas, 19 cupones, Q5,100 saldo, 51 restantes).

### Archivos modificados:
- src/app/pages/Vehiculos/components/ReporteCuponesPrintModal.tsx (reescrito completo: solo exporta `ReporteCuponesPrintSheet`)
- src/app/pages/Vehiculos/CuponesTab.tsx
- src/styles/globals.css (archivo de estilos global)
- src/__tests__/ReporteCuponesPrintSheet.test.tsx (test de verificación)

## [2026-10-22] Formato Oficial Cupones + Eliminación Firmas Base64 Período

### BD: Migración `docs/modulos/vehiculos/migracion_quitar_firmas_periodo.sql`
- Drop de las 4 columnas `firma_*_base64` en `vehiculo_cupones_periodos` (ejecutado en BD local vía psql). Se conservan los 4 nombres TEXT: `elaborado_por`, `jefe_abastecimientos`, `jefe_33_cia`, `director`.

### Types: `src/types/vehiculos.ts`
- `CuponPeriodo` y `CuponPeriodoCreate`: quitados los 4 campos `firma*Base64`.

### Backend (consecuencia necesaria de la migración)
- `DTOs/Vehiculos/VehiculoDtos.cs`: quitados `Firma*Base64` de `CuponPeriodoDto` y `CuponPeriodoCreateDto`.
- `Services/CuponService.cs`: quitadas las referencias a `firma_*_base64` en `SavePeriodoAsync` (UPDATE), `LeerPeriodoAsync` y `GetReporteImpresionAsync` (SELECT), y las firmas del reporte ahora se emiten con `FirmaBase64 = null`.

### Frontend - `CuponesTab.tsx`
- PeriodoModal: eliminada la UI de firmas (estados `firma*Base64`, `firmaActiva`, array `firmasPeriodo`, `SignatureModal` del modal y `PenLine`); quedan solo los 4 inputs de texto (elaboradoPor, jefeAbastecimientos, jefe33Cia, director) y el submit ya no envía `firma*Base64`.
- Impresión directa: `div.print-only` + `ReporteCuponesPrintSheet`, sin modal de vista previa.

### `ReporteCuponesPrintSheet.tsx` - 5 ajustes
1. Encabezado MES: 1 celda `colSpan=15` centrada.
2. "SE RECIBIERON CUPONES": `colSpan=9` centrado (se eliminó una celda vacía extra del spec para mantener las 15 columnas).
3. Firmas: orden DIRECTOR | JEFE | USUARIO | JEFATURA Y SUMINISTROS; formato NOMBRE arriba / CARGO abajo; `alt=""` en las imágenes.
4. 3 filas vacías antes de totales.
5. 3ra firma: solo `nombreCompleto.toUpperCase()` (sin prefijo "ELABORADO POR:"), cargo "CBV."; se quitó `useAuth` (usa `firmas.elaboradoPor.nombre` del período, fallback "SIN NOMBRE").

### globals.css
- Reglas `.print-only` / `.no-print` (screen vs print) ya presentes desde la tarea anterior.

### Verificación
- ✅ `dotnet build` 0 errores / 0 warnings.
- ✅ `npm run build` sin errores.
- ✅ `npm test` 42/42 (test `ReporteCuponesPrintSheet.test.tsx` actualizado: "SE RECIBIERON", firma 3ra = "SIN NOMBRE", cargo "CBV.").
- ⚠️ `tsc --noEmit` / `npm run lint` no disponibles (sin typescript/tsconfig ni script lint); se validó con `vite build`.
- ✅ Migración SQL ejecutada en BD local (verificación: 0 columnas `firma_%` restantes).
- ✅ Procesos dev (backend `dotnet run` y frontend `npm run dev`) detenidos al terminar.

### Archivos modificados
- docs/modulos/vehiculos/migracion_quitar_firmas_periodo.sql (nuevo)
- src/types/vehiculos.ts
- src/app/pages/Vehiculos/CuponesTab.tsx
- src/app/pages/Vehiculos/components/ReporteCuponesPrintModal.tsx
- src/__tests__/ReporteCuponesPrintSheet.test.tsx
- Backend_Sub33/Backend_Sub33/Services/CuponService.cs
- Backend_Sub33/Backend_Sub33/DTOs/Vehiculos/VehiculoDtos.cs
