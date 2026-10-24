# ProyectoSub33 — Contexto Completo para IA

> Última actualización: **2026-10-23** (módulo Finanzas conectado; ver "Historial de Sesiones").
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

- **Módulos conectados a backend:** Auth, Personal, Emergencias, Seguridad/Configuración, Inventario, Donaciones (incluye Libro mensual), Vehículos (incluye Mantenimientos y Cupones) y Finanzas (transacciones + auto-registro Mantenimiento→Gasto y Donaciones→Ingreso).
- **Módulos solo UI / datos mock:** Reportes y Perfil.
- **Componente autónomo sin integrar:** Registro Combustible (`src/components/registro-combustible/`, sin backend, no montado en la app; ver sección propia).
- **Estado de compilación:** `npm run build`, `dotnet build` y `npm run test` (61/61) pasan correctamente al **2026-10-23**.
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
│   ├── __tests__/                 # Vitest: auth, permisos, cupones, finanzas, registro-combustible, seguridad-formato (61 tests)
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
│   ├── modulos/
│   │   ├── inventario/
│   │   ├── emergencias/
│   │   └── vehiculos/
│   │       └── migracion_vehiculos.sql
│   └── planes/                    # Planes, prompts y docs de proyecto (reorganizados aquí 2026-10-23)
│       ├── CONTEXTO.md            # Este archivo
│       ├── README.md
│       ├── LIMPIEZA_CONTEXTO.md
│       └── PLAN_*.md / PROMPT_*.md
├── global.json                    # Fija SDK .NET 8.0.419 (obligatorio; WDAC bloquea DLLs del SDK 10)
├── package.json
├── vite.config.ts                 # manualChunks (vendor/pdffjs/charts/ui)
├── vitest.config.ts               # Configuración de tests
└── reset_db.sql
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
| **Finanzas** | `Finanzas/FinanzasPage.tsx` | `finanzasService.ts`, `useFinanzas` | `FinanzasController` | Conectado. Transacciones (INGRESO/GASTO/DONACION), KPIs, filtros, modal y auto-registro. |
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

### Finanzas

| Tabla | Descripción | PK | FKs / Notas |
|-------|-------------|----|-------------|
| `finanzas_transacciones` | Transacciones financieras (INGRESO / GASTO / DONACION) | `transaccion_id` (BIGSERIAL) | `responsable_id → usuarios`; `modulo_origen` (`MANUAL`, `MANTENIMIENTO`, `DONACIONES`) + `referencia_origen`; índice único que evita auto-registros duplicados |

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

### Finanzas (`/api/finanzas`) — `[Authorize]`

```
GET    /api/finanzas?tipo=&fechaDesde=&fechaHasta=&busqueda=&pagina=&tamanio=  → Lista paginada
GET    /api/finanzas/resumen?desde=&hasta=                 → KPIs (ingresos/gastos/donaciones/balance)
GET    /api/finanzas/{id:long}                             → Detalle
POST   /api/finanzas                                       → Crear transacción manual
PUT    /api/finanzas/{id:long}                             → Actualizar transacción
DELETE /api/finanzas/{id:long}                             → Eliminar transacción
POST   /api/finanzas/auto/gasto-mantenimiento              → Auto-registro GASTO desde Mantenimiento
POST   /api/finanzas/auto/ingreso-donacion                 → Auto-registro DONACION desde Donaciones
```

> **Auto-registro:** `responsable_id` se resuelve del JWT (`usuario_id`); `responsable_nombre` del `personal` vinculado (fallback username). Índice único `(modulo_origen, referencia_origen, tipo)` evita duplicados.

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

- `FinanzasPage.tsx` está **conectado** a `/api/finanzas` (ver sección de endpoints): DataTable server-side, KPIs (Ingresos/Gastos/Donaciones/Balance), filtros (tipo/fecha/búsqueda) y modal de transacción.
- Auto-registro integrado: `MantenimientoModal` (al finalizar) → `crearGastoDesdeMantenimiento()` (GASTO) y `DonacionesPage` (al registrar donación monetaria) → `crearIngresoDesdeDonacion()` (DONACION). Ambos son best-effort (no bloquean la acción principal si Finanzas falla).
- Componentes: `FinanzasPage.tsx` + `components/{TransaccionModal, FinanzasKpiBar, FinanzasFilters}.tsx`; hook `useFinanzas`, service `finanzasService.ts`, tipos `types/finanzas.ts`.
- `ReportesPage.tsx` sigue siendo UI con datos mock.
- Permisos: Finanzas usa `[Authorize]` (sin permisos finos `finanzas.*` todavía); el responsable se deriva del JWT.

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
| `Backend_Sub33/Backend_Sub33/Data/SQL/migracion_finanzas.sql` | Tabla `finanzas_transacciones` + índices (idempotente) |
| `docs/permisos_seed.sql` | Seed idempotente: 47 permisos + asignación por rol |
| `docs/LIMPIEZA_CONTEXTO.md` | Registro del pulido de este archivo (2026-10-22) |
| `plan-cupones.md` | Plan "Libro Mensual de Cupones" (ejecutado) |
| `PLAN_IMPRESO_CUPONES.md` | Plan de vista previa oficial de Cupones (parcialmente revertido) |
| `PLAN_REGISTRO_COMBUSTIBLE.md` | Plan del formulario Registro de Combustible |
| `src/components/registro-combustible/README.md` | Uso del componente autónomo Registro Combustible |
| `global.json` | Fija SDK .NET 8 (obligatorio; WDAC bloquea DLLs del SDK 10) |

---

## Tareas Pendientes (Priorizadas)

### Completadas (2026-10-23)

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
- [x] Tests unitarios Vitest: 10 archivos / **61 tests** (`auth`, `permisos`, `cupones`, `finanzas`, `finanzas.integration`, `useFormValidation`, `registro-combustible`, smoke render, `ReporteCuponesPrintSheet`, `seguridad-formato`).
- [x] Matriz de permisos granular completa (BD + backend + frontend + UI jerárquica).
- [x] Reporte oficial de Cupones + firma de 4 cargos del período.
- [x] Limpieza y pulido de `CONTEXTO.md` (2026-10-22; ver `docs/LIMPIEZA_CONTEXTO.md`).
- [x] **AuthContext 401 handling** — logout automático en 401, evita bucles infinitos (`src/context/AuthContext.tsx`).
- [x] **Soft delete Cupones** — Desactivar/Reactivar/HardDelete en backend + endpoints (`PATCH /cupones/{id}/desactivar`, `PATCH /cupones/{id}/reactivar`, `DELETE /cupones/{id}/purge`).
- [x] **GasolineraAutocomplete** — componente nuevo con creación inline (`src/app/pages/Vehiculos/components/GasolineraAutocomplete.tsx`).
- [x] **DetalleCuponModal** — modal de detalle con acciones Editar/Desactivar/Reactivar/Eliminar (`src/app/pages/Vehiculos/components/DetalleCuponModal.tsx`).
- [x] **Auto-detect "Próximo cupón Nº:"** en CuponModal (`CuponesTab.tsx`).
- [x] **Persistir período** en localStorage (`useCupones.ts`).
- [x] **DraftBanner condicional** en PeriodoModal y CuponModal.
- [x] **Labels claras** "Cupon inicial: DE" / "HASTA cupón Nº:".
- [x] **totalRecibidos auto** (Al - Del + 1) + grid 3 cols en PeriodoModal.
- [x] **Eliminación firmas base64** del período (migración ejecutada).
- [x] **GasolineraAutocomplete** con creación inline.
- [x] **Módulo Finanzas completo** — entidad + DTOs + `FinanzasService` + `FinanzasController` + migración BD + auto-registro (Mantenimiento→Gasto, Donaciones→Ingreso) + `FinanzasPage` (KPIs/DataTable/filtros/modal) + `useFinanzas` + tests.
- [x] **Migración `migracion_soft_delete_auditoria.sql` aplicada** — columnas `activo`, `eliminado_en`, `eliminado_por_nombre` en `vehiculo_cupones` (la tabla `auditoria_eventos` se retiró por no estar referenciada).
- [x] **Soft delete expuesto en `useCupones.ts`** — `desactivarCupon`, `reactivarCupon`, `purgeCupon` agregados al hook y conectados a `DetalleCuponModal`.
- [x] **Mejoras Seguridad y Formato (PLAN_MEJORAS_SEGURIDAD_FORMATO.md, entregables 1-7)** — `HttpRequireRoleAttribute` (solo-admin en Cupones/Vehiculos/Donaciones), `DetalleRegistroModal`, `FiltroEliminados`, prop `validateNumeric` en `input.tsx`, filtro de eliminados lógicos y etiqueta "Eliminado por X" en `CuponesTab.tsx`.

### Pendientes (Priorizadas por impacto × esfuerzo)

#### 🔴 CRÍTICO (Bloquea usuarios / estabilidad) — **Inmediato**

- [ ] **Filtrar por `activo` en backend de cupones** — `GetPeriodoAsync` aceptar parámetro `estado`/`activo` (true/false/null) para filtrar en BD; el frontend ya filtra client-side con `FiltroEliminados`.
- [ ] **Agregar `comisionRealizada` en PeriodoModal** — input en modal "Configurar período"; conectar a `CuponPeriodoCreateDto.ComisionRealizada` (ya existe en DTO/BD).
- [ ] **Implementar auditoría en `CuponService`** — poblar `auditoria_eventos` (tabla retirada de la migración; requiere restablecerla) en Desactivar/Reactivar/HardDelete (usuario_id, usuario_nombre, usuario_rol, antes, despues, campos_cambiados).
- [ ] **Resetear hashes corruptos** (`cmendoza`, `jrodriguez`, `mgonzalez`) — hash BCrypt corrupto por bug escape `$`; login lanza 500.

#### 🟠 ALTO (Escalabilidad / Deuda técnica) — **Esta semana**

- [ ] **Endpoint `GET /api/vehiculos/resumen`** — DTO `VehiculoResumenDto` con totales en BD; frontend usa en KPIs (evita cargar 500 registros).
- [ ] **Firmar ensamblado (.snk) + regla Publisher AppLocker** — genera `.snk`, configura csproj, regla Publisher → soluciona Smart App Control permanentemente.
- [ ] **Migrar `fetch` crudo → `apiClient`** (3 services): `authService.js`, `configuracionService.ts`, `seguridadService.ts`.
- [ ] **Recuperación contraseña/OTP real** — backend: token + expiración + email; frontend: `ForgotPasswordPage` + `ResetPasswordPage`.
- [ ] **Input `comisionRealizada` en PeriodoModal** — UI en modal "Configurar período"; conectar a `CuponPeriodoCreateDto.ComisionRealizada`.

#### 🟡 MEDIO (Features completas / UX) — **Próximas 2 semanas**

- [ ] **Tests de integración** (Testcontainers PostgreSQL) — 1 test por módulo crítico (Vehiculos, Cupones, Emergencias).
- [ ] **Dividir componentes gigantes** — `VehiculosPage.tsx`, `InventarioPage.tsx`, `ReportesPage.tsx` en componentes reutilizables.
- [ ] **Finanzas & Reportes** — definir modelo BD, DTOs, endpoints, permisos y conectar frontend (requiere definición de alcance con stakeholder).
- [ ] **Integrar `RegistroCombustible` en `CuponesTab`** — decisión pendiente: reemplazar vista previa o nuevo tab (modelos de datos distintos).
- [ ] **Paginación real backend Emergencias** — backend paginación server-side + frontend `useEmergencias`.
- [ ] **Migrar `authService.js` a `apiClient`** (usa fetch crudo + `VITE_API_BASE_URL`).
- [ ] **Input `comisionRealizada` en PeriodoModal** — UI en modal "Configurar período".

#### 🟢 BAJO (Pulido / Calidad) — **Continuo**

- [ ] **Dividir `VehiculosPage.tsx`** en componentes (`KpiBar`, `FlotaGrid`, `VehiculoTabs`, `KpiChips`).
- [ ] **Tests E2E** (Playwright) flujos críticos: login → vehiculo → cupon → print.
- [ ] **Observabilidad** — logs estructurados (Serilog), métricas (Prometheus), health checks.
- [ ] **CI/CD** — GitHub Actions: build + test + docker publish.
- [ ] **Documentación viva** — actualizar `CONTEXTO.md` automáticamente en PR.

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
npm run test           # Vitest: 56 tests (auth, permisos, cupones, registro-combustible, finanzas, validación)

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

## [2026-10-22] Mejoras PeriodoModal Cupones

Ejecutado `PLAN_MEJORAS_PERIODO_CUPONES.md` en `src/app/pages/Vehiculos/CuponesTab.tsx` (PeriodoModal). 4 cambios quirúrgicos:

1. **elaboradoPor — auto-fill + control por rol**: importado `useAuth` (`const { user } = useAuth()`); al abrir el modal, si el período no tiene `elaboradoPor`, se autocompleta con `user.name`. El input queda `readOnly={!isAdmin}` y `onChange` solo para admin (Secretario ve el nombre en solo lectura).
2. **Título de sección**: `"Firmas del reporte oficial"` → `"Reporte Oficial"`.
3. **totalRecibidos — cálculo automático**: eliminado el estado `total`; `totalCalculado = useMemo(Al - Del + 1)`; el submit envía `totalRecibidos: totalCalculado`; el input manual se reemplazó por un display readonly "{totalCalculado} cupones"; grid ahora 3 columnas (Del, Al, Valor).
4. **Firmas base64**: ya eliminadas en la tarea anterior (SignatureModal del modal, estados `firma*`/`firmaActiva`, UI de firmas); quedan los 4 inputs de texto (elaboradoPor + jefeAbastecimientos + jefe33Cia + director).

### Verificación
- ✅ `npm run build` sin errores.
- ✅ `npm test` 42/42.
- ⚠️ `tsc --noEmit` / `npm run lint` no disponibles (sin typescript/tsconfig ni script lint); se validó con `vite build`.
- ✅ Procesos dev (backend `dotnet run` y frontend `npm run dev`) detenidos al terminar; puertos 5196/5173 libres.

### Archivos modificados
- src/app/pages/Vehiculos/CuponesTab.tsx
- src/app/pages/Vehiculos/components/GasolineraAutocomplete.tsx (NUEVO)
- src/app/pages/Vehiculos/components/DetalleCuponModal.tsx (NUEVO)
- src/types/vehiculos.ts (Activo, EliminadoEn, EliminadoPorNombre)
- src/services/vehiculosService.ts (desactivar, reactivar, purge)
- src/hooks/useCupones.ts (persistir período localStorage)
- Backend: CuponService.cs (soft delete + reactivate + hard delete), CuponesController.cs (endpoints), VehiculoDtos.cs (Activo)
- docs/modulos/vehiculos/migracion_soft_delete_auditoria.sql (NUEVO)

## [2026-10-23] Mejoras CuponModal + DraftBanner Condicional + Soft Delete + Validaciones + Autocomplete + Detalle Modal

Ejecutado `PLAN_MEJORAS_PERIODO_CUPONES.md` (actualización final) en `src/app/pages/Vehiculos/CuponesTab.tsx`.

### CuponModal
1. **Auto-detect "Próximo cupón Nº:"** (Del): si primer registro → `periodo.cuponInicialDel`; si hay cupones → `max(cuponAl) + 1`. Auto-fill al abrir nuevo cupón.
2. **Label**: "Cupón Del" → "Próximo cupón Nº:".
3. **Responsable auto-fill + rol**: `user.name` al abrir; Admin editable, Secretario readOnly.
4. **Quitar tarjeta "Firma digital"**: resumen queda con 2 tarjetas (Total de cupones + Haber); grid `sm:grid-cols-2`.
5. **DraftBanner condicional**: solo muestra si `!cupon` (nuevo) Y `savedAt !== null`.

### PeriodoModal
1. **Labels**: "Cupón inicial Del" → "Cupon inicial: DE" / "Cupón inicial Al" → "HASTA cupón Nº:".
2. **DraftBanner condicional**: solo muestra si `!periodo` (nuevo) Y `savedAt !== null`.

### Verificación
- ✅ `npm run build` sin errores.
- ✅ `npm test` 42/42.
- ✅ Procesos dev detenidos al terminar; puertos 5196/5173 libres.

### Archivos modificados
- src/app/pages/Vehiculos/CuponesTab.tsx

## [2026-10-22] Mejoras PeriodoModal + CuponModal Cupones

Ejecutado `PLAN_MEJORAS_PERIODO_CUPONES.md` en `src/app/pages/Vehiculos/CuponesTab.tsx` (2 modales). Cambios quirúrgicos:

### PeriodoModal
1. **Draft `useFormDraft("periodo.create")`** (del, al, valor, notas, elaboradoPor, jefeAbastecimientos, jefe33Cia, director): guardado debounced en localStorage; se restaura al abrir si el período no está configurado (sin `cuponInicialDel/Al`); `clear()` tras guardar; `DraftBanner` en el form.
2. **elaboradoPor auto-fill + rol** (ya aplicado antes): `user.name` al abrir; Admin editable, Secretario readOnly.
3. **Título** `"Reporte Oficial"` (ya aplicado).
4. **Labels**: `"Cupon inicial: DE"` / `"HASTA cupón Nº:"`.
5. **totalRecibidos auto** `useMemo(Al - Del + 1)` + grid 3 cols (ya aplicado).
6. **Firmas base64** eliminadas (ya aplicado).

### CuponModal
1. **Quitar tarjeta "Firma digital"**: la fila de resumen queda con 2 tarjetas (Total de cupones + Haber); grid `sm:grid-cols-2`.
2. **Responsable auto-fill + rol**: al crear cupón nuevo, `responsable` se autocompleta con `user.name`; input `readOnly={!isAdmin}` (Admin editable, Secretario readOnly).
3. **Draft `useFormDraft("cupon.create")`**: verificado que ya funcionaba (sin cambios).

### Verificación
- ✅ `npm run build` sin errores.
- ✅ `npm test` 42/42.
- ⚠️ `tsc --noEmit` / `npm run lint` no disponibles (sin typescript/tsconfig ni script lint); se validó con `vite build`.
- ✅ Procesos dev (backend + frontend) detenidos al terminar; puertos 5196/5173 libres.

### Archivos modificados
- src/app/pages/Vehiculos/CuponesTab.tsx

## [2026-10-23] AuthContext 401 Handling + Plan 10/10

### AuthContext 401 Handling (resuelto por IA de pago)
- **Problema:** Token inválido/expirado → 401 en `loadModulos`/`loadPermisos` → app se quedaba trabada sin redirigir al login.
- **Solución:** `src/context/AuthContext.tsx`
  - Importado `ApiError` desde `seguridadService`.
  - `isUnauthorized()` detecta `status === 401`.
  - `loadModulos` y `loadPermisos` llaman a `logout()` al recibir 401 (limpia localStorage y redirige a login).
- **Resultado:** Token expirado/inválido → logout automático → redirige a login limpio. Sin bucles 401, UX limpia.

### Plan Maestro 10/10 (Post AuthContext Fix)

#### FASE 1: GAPS CRÍTICOS (1-2 días)

1. **Exponer soft delete en `useCupones.ts`** — `desactivarCupon`, `reactivarCupon`, `purgeCupon` + conectar `DetalleCuponModal`.
2. **Conectar `filtroEstado`** — hook: parámetro `estado` en `cargar()`; backend: `GetPeriodoAsync` filtrar por `activo`.
3. **`comisionRealizada` en PeriodoModal** — input en modal "Configurar período" → `CuponPeriodoCreateDto.ComisionRealizada`.
4. **Ejecutar migración `migracion_soft_delete_auditoria.sql`** — columnas `activo`, `eliminado_en`, `eliminado_por_nombre` + tabla `auditoria_eventos`.
5. **Auditoría en `CuponService`** — poblar `auditoria_eventos` en Desactivar/Reactivar/HardDelete (usuario_id, nombre, rol, antes, despues, campos_cambiados).

#### FASE 2: ENDPOINTS CRÍTICOS (1-2 días)
6. **Endpoint `GET /api/vehiculos/resumen`** — DTO `VehiculoResumenDto` con totales en BD; frontend KPIs usan endpoint (0 carga 500 registros).
7. **Resetear hashes corruptos** (`cmendoza`, `jrodriguez`, `mgonzalez`) — hash BCrypt corrupto por escape `$`.
8. **Firmar ensamblado (.snk) + regla Publisher AppLocker** — genera `.snk`, config csproj, regla Publisher → soluciona Smart App Control.

#### FASE 3: DEUDA TÉCNICA (3-5 días)
9. **Migrar fetch → apiClient** (3 services): `authService.js`, `configuracionService.ts`, `seguridadService.ts`.
10. **Recuperación contraseña/OTP real** — backend token + expiración + email; frontend `ForgotPasswordPage` + `ResetPasswordPage`.
11. **Tests de integración** (Testcontainers) — 1 test por módulo crítico.

#### FASE 4: FEATURES (1-2 semanas)
12. **Finanzas & Reportes** — definir alcance con stakeholder.
13. **Paginación real Emergencias** — backend paginación server-side + frontend `useEmergencias`.

---

### Verificación obligatoria post-impl

```bash
npm run build && npm test && dotnet build && dotnet test
# 0 errors, 42+ tests passing
psql -f docs/modulos/vehiculos/migracion_soft_delete_auditoria.sql
# Verificar: SELECT * FROM vehiculo_cupones WHERE activo = FALSE;
# Verificar: SELECT * FROM auditoria_eventos LIMIT 5;
```

---

### Archivos clave a modificar (FASE 1)

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useCupones.ts` | Exponer `desactivarCupon`/`reactivarCupon`/`purgeCupon` + `filtroEstado` en `cargar()` |
| `src/app/pages/Vehiculos/CuponesTab.tsx` | `comisionRealizada` input + `filtroEstado` UI |
| `Backend/Services/CuponService.cs` | Auditoría en Desactivar/Reactivar/HardDelete |
| `Backend/Services/VehiculoService.cs` | `GetResumenAsync` |
| `Backend/Controllers/VehiculosController.cs` | `GET /resumen` |
| `docs/modulos/vehiculos/migracion_soft_delete_auditoria.sql` | Ejecutar en BD |
| `Backend_Sub33.csproj` | Firmar ensamblado (.snk) |
| `src/services/configuracionService.ts` | Migrar a `apiClient` |
| `src/services/seguridadService.ts` | Migrar a `apiClient` |

---

### Verificación post-impl

```bash
npm run build && npm test && dotnet build && dotnet test
# 0 errors, 42+ tests passing
psql -f docs/modulos/vehiculos/migracion_soft_delete_auditoria.sql
# Verificar: SELECT * FROM vehiculo_cupones WHERE activo = FALSE;
# Verificar: SELECT * FROM auditoria_eventos LIMIT 5;
```

### Prompt para otra IA

```markdown
Implementa FASE 1 del plan 10/10 en `src/hooks/useCupones.ts` + `src/app/pages/Vehiculos/CuponesTab.tsx` + Backend `CuponService.cs` + `VehiculoService.cs` + `VehiculosController.cs`. Migración `migracion_soft_delete_auditoria.sql` en BD. Auditoría en `CuponService`. Verifica: `npm run build && npm test && dotnet build && dotnet test`. No dejes servers. Actualiza CONTEXTO.md.
```

## Módulo Finanzas completo (2026-10-23)

Ejecutado `PLAN_FINANZAS_MODULO.md`. Módulo Finanzas conectado a backend con auto-registro.

### Backend
- **Entidad** `Models/Entities/FinanzaTransaccion.cs` (tabla `finanzas_transacciones`, PK `transaccion_id` BIGSERIAL) + `DbSet` + config en `AppDbContext`.
- **DTOs** `DTOs/Finanzas/FinanzasDtos.cs`: `TransaccionDto`, `TransaccionCreateDto`, `TransaccionUpdateDto`, `TransaccionFiltrosDto`, `ResumenFinancieroDto`, `TransaccionListResponseDto`, `AutoGastoMantenimientoDto`, `AutoIngresoDonacionDto`.
- **Service** `Services/IFinanzasService.cs` + `FinanzasService.cs` (Dapper): listar paginado con filtros (tipo/fecha/búsqueda), resumen (ingresos/gastos/donaciones/balance), CRUD manual, y métodos `CrearGastoDesdeMantenimientoAsync` / `CrearIngresoDesdeDonacionAsync` (idempotentes: pre-check por `modulo_origen`+`referencia_origen`+`tipo`). Responsable: `responsable_id` = `usuario_id` del JWT, `responsable_nombre` resuelto de `personal` (fallback username).
- **Controller** `Controllers/FinanzasController.cs` (`[Authorize]`): `GET/POST/PUT/DELETE /api/finanzas*` + `GET /resumen` + `POST /auto/gasto-mantenimiento` + `POST /auto/ingreso-donacion`.
- **DI** registrado en `Program.cs` (`IFinanzasService`).
- **Migración** `Data/SQL/migracion_finanzas.sql` (idempotente): tabla + 3 índices + índice único `(modulo_origen, referencia_origen, tipo)`. **Ejecutada en BD `Sub_33`.**

### Frontend
- `types/finanzas.ts`, `services/finanzasService.ts` (usa `apiClient`), `hooks/useFinanzas.ts`.
- `FinanzasPage.tsx` refactorizado: `FinanzasKpiBar` + `FinanzasFilters` + `DataTable` server-side + `TransaccionModal` (components nuevos en `pages/Finanzas/components/`).
- **Auto-registro:** `MantenimientoModal.tsx` (al finalizar con costo>0) → `crearGastoDesdeMantenimiento()`; `DonacionesPage.tsx` (donación monetaria) → `crearIngresoDesdeDonacion()`. Ambos best-effort (try/catch + `toast.warning`), no bloquean la acción principal.

### Decisión de diseño (desviación del plan)
- El plan proponía auto-registro **tanto en backend** (`DonacionService`/`VehiculoService` → `IFinanzasService`) **como en frontend**. Para evitar **doble registro**, se implementó solo el **auto-registro frontend-driven** vía endpoints dedicados (`/auto/*`). El responsable se resuelve **server-side** desde el JWT (no se confía en `personal_id` del cliente, que además no coincide con `responsable_id → usuarios(usuario_id)`).
- No se creó `src/hooks/useFormValidation.ts` (el plan lo listaba bajo "consistencia global"); las validaciones siguen el patrón manual del resto de módulos.

### Tests
- `src/__tests__/finanzas.test.ts` (6 tests: service/URL/CRUD/resumen).
- `src/__tests__/finanzas.integration.test.ts` (2 tests: contrato auto-registro Mantenimiento→Gasto y Donaciones→Ingreso).

### Verificación
- `dotnet build` → 0 warnings / 0 errors.
- `dotnet test` → exit 0.
- `npm run build` → sin errores.
- `npm test` → 56/56 passing.
- `psql -f Backend_Sub33/Backend_Sub33/Data/SQL/migracion_finanzas.sql` → ejecutada (CREATE TABLE + 4 índices).
- Sin servidores corriendo (puerto 5196 libre).

## Validación + Alertas + Draft unificados (2026-10-23)

Ejecutado `PLAN_VALIDACION_ALERTAS_DRAFT.md`. Patrón de validación/alertas unificado + componentes reutilizables.

### NUEVOS
- `src/hooks/useFormValidation.ts` — validadores puros (`validateRequired`, `validateNumber`, `validateMin`, `validateMax`, `validateAsync`, `sanitizeNumber`) + hook `useFormValidation()` (`errors` object, `setError`, `clearErrors`, `hasErrors`).
- `src/app/components/ui/NumberInput.tsx` — input numérico estricto: filtra letras/símbolos en `onChange`, `toast.error` (throttle 800ms) y admite `allowDecimal`.

### MODIFICADOS
- `src/hooks/useFormDraft.ts` — `save()` ahora actualiza `draft` (fuente de verdad del banner); nuevo `reset()` (alias de `clear`) que limpia `draft` + `savedAt` + localStorage + timer pendiente.
- `src/app/components/ui/DraftBanner.tsx` — ahora recibe `draft` y solo renderiza si `draft !== null` (online) o si está offline.
- `src/app/components/ui/input.tsx` — nueva prop opcional `validate?: (value) => string | null`.
- `src/app/pages/Vehiculos/CuponesTab.tsx` — `PeriodoModal` y `CuponModal` migrados a patrón `errors` object + `toast.error` (antes `error` string, con `setError` sin definir en PeriodoModal). Campos numéricos con `NumberInput` (del/al/valor/kilometraje/galonaje). `DraftBanner` ahora usa `draft`.
- Los 11 restantes usos de `DraftBanner` actualizados a `draft={draft}` (Personal/PersonalForm agrega prop `draft`).
- `NumberInput` aplicado a monto de Finanzas (TransaccionModal) y a monto/cantidad/valorEstimado de Donaciones.

### Fix draft (bug raíz)
- El auto-save se disparaba al abrir un modal nuevo porque `responsable`/fecha/valor venían pre-llenados. Se agregó guard `dirtyRef` en PeriodoModal/CuponModal: solo guarda borrador tras edición real del usuario (no en apertura). Tras guardar + abrir nuevo modal, el banner ya no aparece.

### Verificación
- `npm run build` → sin errores.
- `npm test` → 56/56 (nuevo `useFormValidation.test.ts`, 6 tests).
- `dotnet build` → 0 warnings / 0 errors. `dotnet test` → exit 0.
- Servidores dev detenidos (puertos 5196/5173 libres).

## Responsividad Profesional - Todos los Módulos (2026-10-23)

Ejecutado `PLAN_RESPONSIVE_PROFESIONAL.md`. Sistema híbrido desktop/mobile en todos los módulos.

### NUEVOS
- `src/app/components/ui/ResponsiveTable.tsx` - tabla híbrida: desktop (`hidden md:block`) + cards mobile (`md:hidden`). Props: `columns`, `data`, `keyField`, `renderCard` opcional.

### MODIFICADOS
- `src/app/components/ui/data-table.tsx` - ahora renderiza cards mobile (`md:hidden`) generadas desde las columnas + tabla desktop (`hidden md:block`). Esto hace responsivas TODAS las páginas que usan `DataTable` (Inventario, Donaciones, Emergencias, Finanzas, Reportes, Personal, Seguridad).
- `src/app/components/ui/modal.tsx` - `max-w-[95vw]` mobile + `max-h-[90vh]` + footer sticky (ya presentes).
- `src/app/pages/Vehiculos/CuponesTab.tsx` - tabla 15 cols envuelta en `hidden md:block` + card view mobile `md:hidden` (responsable, fecha, saldo, firma, acciones). KPIs `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. PeriodoModal `grid-cols-1 sm:grid-cols-2`.
- `src/app/pages/Donaciones/LibroDonacionesTab.tsx` - tabla 14 cols → híbrida + cards mobile. KPIs `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
- `src/app/pages/Vehiculos/VehiculosPage.tsx` - KPIs `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (KpiCard `w-full`).
- `src/app/pages/Vehiculos/components/DetalleCuponModal.tsx` - grid `grid-cols-1 sm:grid-cols-2`.
- `src/app/pages/Vehiculos/components/MantenimientoModal.tsx` - grids ya responsivos (`sm:grid-cols-2 lg:grid-cols-3/4`).

### Verificación
- `npm run build` → sin errores.
- `npm test` → 56/56 passing.
- `dotnet build` → 0 warnings / 0 errors.
- `dotnet test` → exit 0.
- Sin servidores corriendo.

## Fix: Guardado de período + borrador (2026-10-23)

Corrección del módulo Vehículos (cupones), sin tocar otros módulos.

### Backend / BD
- La BD `vehiculo_cupones` no tenía las columnas de soft-delete (`activo`, `eliminado_en`, `eliminado_por_nombre`) que `CuponService.CuponSelect` y los métodos de soft-delete ya usaban → 500 `42703: no existe la columna c.activo`.
- Se corrigió `docs/modulos/vehiculos/migracion_soft_delete_auditoria.sql` (tipos `INT`→`UUID` para `*_por_id`; se retiró la tabla `auditoria_eventos` no referenciada) y se aplicó a `Sub_33` con `psql`. Verificado `SELECT c.activo ... FROM vehiculo_cupones` OK.

### Frontend
- `CuponesTab.tsx`:
  - `PeriodoModal`: eliminado el `clear()` que borraba el borrador al abrir (autoguardado ahora solo hace `save` cuando `dirtyRef` es true) → el borrador sobrevive a cerrar/refrescar/cambiar de módulo.
  - `handleGuardarPeriodo`: ya no traga el error ni duplica toast; ahora relanza y deja el manejo de éxito/error al modal (único toast, borrador solo se limpia al guardar real).
  - `CuponModal`: mismo fix del autoguardado (`clear()` condicional eliminado).

### Verificación
- `npm run build` → sin errores.
- `npm test` → 56/56 passing.
- `dotnet build` → 0 warnings / 0 errors. `dotnet test` → exit 0.

## Mejoras Seguridad y Formato (2026-10-23)

Ejecutado `PLAN_MEJORAS_SEGURIDAD_FORMATO.md` (entregables 1-7).

### Backend
- Nuevo atributo `Attributes/HttpRequireRoleAttribute.cs`: restringe acción a un rol (p. ej. `Administrador`), cortocircuita con 403 si no cumple.
- Aplicado "solo admin" a: `CuponesController` (`reactivar`, `purge`), `VehiculosController.DeleteMantenimiento`, `DonacionesController.DeleteDonacion`.

### Frontend (NUEVOS componentes)
- `src/app/components/ui/DetalleRegistroModal.tsx` - modal genérico de detalle (campos, estado activo/inactivo, acciones editar/desactivar/reactivar/eliminar según permisos).
- `src/app/components/ui/FiltroEliminados.tsx` - toggle "Mostrar eliminados lógicamente" (solo visible para admin).

### Frontend (modificados)
- `input.tsx` - nueva prop `validateNumeric`: filtra solo dígitos en `onChange`.
- `CuponesTab.tsx`:
  - Filtro de eliminados lógicos integrado (`FiltroEliminados`), visible solo admin; filtra `activo !== false` por defecto.
  - Tabla (desktop) y cards (mobile) muestran "Eliminado por {nombre}" en registros inactivos.
  - `DetalleCuponModal` conectado a `desactivarCupon`/`reactivarCupon`/`purgeCupon` con `isAdmin` real y `activo` del registro.
- `useCupones.ts` - expone `desactivarCupon`, `reactivarCupon` y `purgeCupon` en el hook.

### Ya existente (verificado)
- `NumberInput` (validación numérica estricta + toast.error), `useFormValidation` (validadores), soft-delete de cupones (`activo`, `eliminado_en`, `eliminado_por_nombre`), `DetalleCuponModal`, módulo Finanzas, `usePermisos` con `isAdmin`/roles.

### Tests
- `src/__tests__/seguridad-formato.test.tsx` (5 tests: `FiltroEliminados` render, `DetalleRegistroModal` export, `sanitizeNumber`).

### Verificación
- `npm run build` → sin errores.
- `npm test` → 61/61 passing (10 archivos).
- `dotnet build` → 0 warnings / 0 errors.
- `dotnet test` → exit 0.
- Servidores detenidos (puertos 5196 y 5173 libres).

## Seguridad de Autenticación + Recuperación de Contraseña (2026-10-23)

### Backend
- `Data/SQL/migracion_seguridad_auth.sql` — `usuarios.email`, `usuarios.intentos_fallidos`, `usuarios.bloqueado_hasta`, `codigos_recuperacion.email_destino` + `codigo_otp_hash` (idempotente; aplicar con psql, NO `dotnet ef database update`).
- `Services/EmailService.cs` + `IEmailService.cs` — envío SMTP vía MailKit (587/STARTTLS); plantilla HTML 33ª CVB.
- `Services/JwtFactory.cs` — tokens con `Issuer`/`Audience`, access token 15 min, reset token (claim `purpose=reset`, 10 min).
- `Controllers/AuthController.cs` — login con bloqueo (3 intentos → 15 min), anti-enumeración (mensaje único + verificación BCrypt dummy), refresh token con rotación (cookie httpOnly `refresh_token`, `SameSite=Strict`, `Path=/api/auth`), logout que revoca sesión, bitácora `bitacora_accesos` (LOGIN_EXITOSO/FALLIDO/BLOQUEADO con IP). El claim `permiso` ahora incluye `usuario_permisos` (UNION con `rol_permisos`).
- `Controllers/RecuperacionController.cs` — `solicitar-recuperacion` (OTP 6 dígitos, HMAC-SHA256, 10 min), `verificar-otp`, `restablecer-contrasena`, `cambiar-contrasena` `[Authorize]`.
- `Program.cs` — JWT con Issuer/Audience, CORS con `AllowCredentials` + orígenes específicos, rate-limit `RecuperacionPolicy`.
- `PersonalService` + DTOs — `email` obligatorio al otorgar acceso al sistema (unicidad + validación).

### Frontend
- `services/auth/tokenStore.ts` — access token en memoria (no en localStorage).
- `services/authService.js` — `login(recordar)`, `refresh`, `logout`, `solicitarRecuperacion`, `verificarOtp`, `restablecerContrasena`, `cambiarContrasena` con `credentials:"include"`.
- `services/api/client.ts` — 401 → intenta `refresh` y reintenta; si falla emite `auth:unauthorized`.
- `context/AuthContext.tsx` — restauración de sesión por refresh token al recargar; logout global ante `auth:unauthorized`; fallback de rol `voluntario` (antes `admin`).
- `LoginPage.tsx` — recuperación cableada a endpoints reales; "recordar" controla la cookie; mensajes de error unificados.
- `PersonalForm.tsx` / `PersonalPage.tsx` — campo "Correo electrónico *" en Acceso al Sistema.

### Configuración SMTP (secretos)
- Valores reales en `Backend_Sub33/Backend_Sub33/appsettings.Development.json` (sección `Smtp`), **ignorado en git** (`.gitignore` + `git rm --cached`). `appsettings.json` mantiene `Smtp.User`/`Smtp.Password` vacíos.

## Bloqueo permanente + desbloqueo por admin (2026-10-23)

- `Data/SQL/migracion_bloqueo_manual.sql` — `usuarios.bloqueada BOOLEAN DEFAULT FALSE`; elimina `usuarios.bloqueado_hasta` (temporal) y `codigos_recuperacion.codigo_otp` (obsoleto; lo reemplaza `codigo_otp_hash`). **Fix del error 23502** (not-null en `codigo_otp` al solicitar recuperación).
- `reset_db.sql` alineado: `usuarios` con `email`/`intentos_fallidos`/`bloqueada`; `codigos_recuperacion` con `codigo_otp_hash`/`email_destino`/`telefono_destino` nullable.
- **Bloqueo silencioso**: login responde siempre `"Las credenciales ingresadas son incorrectas."` (también cuando la cuenta está bloqueada) — no da pistas a atacantes.
- Umbrales: `Seguridad:MaxIntentos = 5` (usuarios normales) y `Seguridad:MaxIntentosAdmin = 10` (admin). Al alcanzarlo → `bloqueada = true` (permanente).
- **Desbloqueo manual**: `POST /configuracion/usuarios/{id}/desbloquear` + columna "Bloqueo" (badge + botón "Desbloquear") en `SeguridadPage` → Usuarios.
- `RecuperacionController.restablecer-contrasena` ya **no** desbloquea (solo cambia la clave).
- `EsAdminAsync` en `AuthController` detecta rol Administrador para aplicar el umbral de 10 intentos.
- **Ojo de contraseña único**: nuevo `ui/PasswordField.tsx` (input + toggle), usado en `ProfilePage` y `PersonalForm` (elimina el `PasswordInput` local y los ojos ad-hoc).

### Verificación
- `dotnet build` → 0 warnings / 0 errors.
- `npm run build` → éxito.
- `npm test` → 61/61 passing.
- Migración `migracion_bloqueo_manual.sql` aplicada a `Sub_33` (psql) y verificada.

## Perfil de Bombero + Seguridad UI (2026-10-23)

### Bugs corregidos
- **Ojo duplicado** en login y registro de miembro: se ocultó el ícono nativo del navegador (`input[type=password]::-ms-reveal / ::-ms-clear / ::-webkit-credentials-auto-fill-button` en `globals.css`).
- **Badge "Rango" en blanco (light)**: `ui/badge.tsx` variant `brand` pasó de `bg-[var(--grad-primary)]` (que Tailwind compila como `background-color` sobre un gradiente → inválido) a `bg-[var(--brand-600)] text-white`.

### Email de verificación (Gmail)
- `EmailService.cs`: asunto y plantilla → **"Subestación 33"** con logo institucional embebido (`wwwroot/images/logo_institucional.png`, vía `LinkedResource` con `cid:logo`; se copió desde `src/imports/image-1.png`). Se inyectó `IWebHostEnvironment`.

### Foto de perfil (base64)
- `Data/SQL/migracion_perfil_foto.sql`: `usuarios.foto_base64 TEXT` (aplicada y verificada).
- `Usuario.cs` + `AppDbContext.cs` + `AuthResponseDto.FotoBase64` + `AuthController` (login/refresh incluyen `fotoBase64`).
- `POST /api/auth/foto` `[Authorize]` → guarda la foto (payload `{ fotoBase64 }`, límite ~2 MB).
- Frontend: `subirFoto()` en `authService.js`; `App.tsx` carga el avatar desde `user.fotoBase64` y persiste al subir; `ProfilePage` permite "Subir Nueva Foto".

### Verificación en 2 pasos (cambio de contraseña)
- `POST /api/auth/enviar-codigo-2fa` `[Authorize]` → envía OTP al correo registrado (`usuarios.email`).
- `cambiar-contrasena` ahora exige `{ contrasenaActual, nuevaContrasena, codigo }` (valida OTP hasheado antes de cambiar).
- Frontend: `enviarCodigo2fa()` + `cambiarContrasena(actual, nueva, codigo)` en `authService.js`; `ProfilePage` → pestaña **Seguridad** con contraseña actual + nueva + confirmar + código 2FA.

### Mi Perfil de Bombero (rediseño `ProfilePage.tsx`)
- Solo tabs **Perfil** y **Seguridad** (se eliminaron Notificaciones y Preferencias).
- **Perfil**: nombre real (`AuthContext.user.name`), **Rango** real (`GET /personal/{personalId}` → `rangoNombre`), foto de perfil; **sin** campo "Correo Electrónico".
- `App.tsx`: se eliminó el `profileForm` hardcodeado ("Carlos García Soc"); el dropdown ya no muestra el correo hardcodeado.

### Verificación
- `dotnet build` → 0 warnings / 0 errors.
- `npm run build` → éxito.
- `npm test` → 61/61 passing.
- Migración `migracion_perfil_foto.sql` aplicada a `Sub_33` (psql) y verificada.
- Servidores back/front **detenidos** (sin procesos corriendo).

## Ajustes Perfil + Correo + Primera sesión (2026-10-23)

### Bug del ojo (causa raíz)
- La regla `::-ms-reveal / ::-ms-clear / ::-webkit-credentials-auto-fill-button` estaba en `globals.css`, que **no está importado** (`index.css` solo importa fonts/tailwind/theme/animations). Se movió a `theme.css` (que sí se carga). Ahora el navegador no muestra su ojo nativo en campos de contraseña.

### Correo (sin adjunto + 3 min)
- `EmailService.cs`: el logo ya no se envía como `LinkedResource` (adjunto). Ahora se incrusta como **data URI base64** (`<img src="data:image/png;base64,...">`), leído de `wwwroot/images/logo_institucional.png`.
- OTP expira en **3 minutos** (`Seguridad:OtpMinutos = 3`).
- `LoginPage`: el botón **"Reenviar"** ahora vuelve a llamar `solicitarRecuperacion` (antes solo limpiaba las cajas).

### Cambio de contraseña (sin contraseña actual + reveal progresivo)
- `cambiar-contrasena` ya **no** pide `ContrasenaActual` (solo `nuevaContrasena` + `codigo`). DTO y controlador actualizados.
- `ProfilePage` pestaña Seguridad: se quitó el bloque "Verificación en 2 pasos"; queda [Nueva][Confirmar][Enviar código] → al enviar, se despliegan [Código de verificación][Cambiar contraseña].

### Primera sesión: cambio obligatorio de contraseña
- `Data/SQL/migracion_debe_cambiar_contrasena.sql`: `usuarios.debe_cambiar_contrasena BOOLEAN DEFAULT FALSE` (aplicada y verificada).
- `PersonalService`: al **crear/otorgar acceso** (y al resetear contraseña desde `ActualizarAccesoSistemaAsync`) se marca `DebeCambiarContrasena = true`.
- `AuthResponseDto` + `AuthController` (login/refresh): incluyen `debeCambiarContrasena`.
- Frontend: `ForzarCambioContrasena.tsx` bloquea la app cuando `user.debeCambiarContrasena` es `true`; al cambiar, se cierra sesión y se re-ingresa con la nueva clave. `cambiar-contrasena` pone el flag en `false`.

### Mi Perfil de Bombero (sin datos repetidos + foto recortada + cierre al navegar)
- `ProfilePage` reestructurado:
  - **Tarjeta izquierda (resumen):** avatar + "Subir Nueva Foto" + Nombre Completo + Rango + Compañía.
  - **Pestaña Perfil:** datos detallados (Nombre completo, Rango, Rol del Sistema, Teléfono, Código de Bombero, Usuario del Sistema) vía `GET /personal/{personalId}`.
  - **Foto con recorte:** se agregó `react-easy-crop` (dependencia) con modal de recorte (cuadrado + zoom) antes de guardar.
- `App.tsx`: al seleccionar un módulo en el menú lateral se ejecuta `setProfileOpen(false)` (el perfil ya no queda superpuesto).

### Verificación
- `dotnet build` → 0 warnings / 0 errors.
- `npm run build` → éxito.
- `npm test` → 61/61 passing.
- Migración `migracion_debe_cambiar_contrasena.sql` aplicada a `Sub_33` (psql) y verificada.
- Servidores back/front **detenidos**.

## Correo: logo inline + identificación de usuario (2026-10-23)

- **Causa del diseño roto:** Gmail **no renderiza** imágenes `data:` URI (las elimina), por lo que el logo incrustado como base64 en el `src` se veía roto. Se volvió al método `LinkedResource` (MIME `multipart/related`, `cid:logo`) con `ContentDisposition.Inline` explícito → el logo se ve inline y **sin adjunto**.
- `EmailService.EnviarCodigoOtpAsync(correoDestino, nombreUsuario, codigoOtp)`: el correo ahora saluda al usuario (`Hola, {username}`) para identificar quién está iniciando sesión.

### Recuperación por usuario + correo (coincidencia obligatoria)
- `solicitar-recuperacion` ahora recibe `{ username, email }` y **solo** envía el código si ambos coinciden con la cuenta. Mensajes:
  - Éxito: `"Código enviado correctamente, verifique su correo."`
  - Error: `"Información incorrecta, verifique sus datos."`
- `verificar-otp` también recibe `{ username, email, codigo }`.
- `enviar-codigo-2fa` (logueado) usa el mismo mensaje de éxito y envía el correo con el nombre de usuario.
- Frontend `LoginPage`: `ForgotStep` ahora pide **Usuario** + **Correo electrónico** (dos campos); `authService.solicitarRecuperacion(username, email)` y `verificarOtp(username, email, codigo)`.
- OTP expira en **3 minutos** (`Seguridad:OtpMinutos = 3`).

### Verificación
- `dotnet build` → 0 warnings / 0 errors.
- `npm run build` → éxito.
- `npm test` → 61/61 passing.
- Servidores back/front **detenidos**.


## Correo sin imagen (2026-10-23)

- Se **quitaron la imagen/logo** del correo de verificación por completo (ya no se envía LinkedResource ni data URI). La plantilla queda limpia: encabezado "SUBESTACIÓN 33" + saludo al usuario + código + pie, sin adjuntos ni imágenes.
- EmailService ya no inyecta IWebHostEnvironment (dependencia removida).
- Verificado: dotnet build 0 warnings / 0 errors.

## Módulo de Reportes imprimibles (2026-10-23)

- Reportes/ReportesPage.tsx reescrito (antes era mock/charts vacíos). Ahora es un sistema de **impresión de reportes por módulo** (sin cupones).
- Módulos: **Personal, Emergencias, Inventario, Donaciones, Vehículos, Finanzas** — un reporte por módulo con tabla tipo Excel.
- Reportes/components/ReportePrintSheet.tsx (genérico): membrete **"SUBESTACIÓN 33"** + subtítulo "Bomberos Voluntarios · San Lucas Tolimán, Sololá", título del reporte, **filtros aplicados**, **"Impreso por: {nombre completo}"** (del usuario logueado, sin correo), fecha de impresión, total de registros y tabla .excel-table con @media print (patrón de ReporteCuponesPrintSheet).
- Filtros por módulo (rápidos): Personal (estado/búsqueda), Emergencias (estado/desde/hasta/búsqueda), Inventario (categoría/búsqueda), Donaciones (tipo/estado/búsqueda), Vehículos (estado/estado operativo/búsqueda), Finanzas (tipo/desde/hasta/búsqueda) + "Limpiar".
- Vista previa en pantalla (tabla con scroll + sticky header) + botón **Imprimir** (window.print()).
- Datos reales vía servicios existentes (getPersonal, emergenciaService.getEmergencias, inventarioService.getItems, donacionService.getDonaciones, ehiculosService.getVehiculos, inanzasService.getTransacciones) con página grande (500–1000).
- Se eliminó la dependencia de recharts en Reportes (el chunk charts se redujo).

### Verificación
- 
pm run build → éxito.
- 
pm test → 61/61 passing.

## Reportes: logos + fecha de creación + centrado (2026-10-23)

- Reportes/components/ReportePrintSheet.tsx: encabezado con **2 logos institucionales** (image-1.png a la izquierda, image-2.png a la derecha) y "SUBESTACIÓN 33" centrado.
- Todo el contenido de la hoja queda **centrado** (título, filtros, total, impreso por, fecha y celdas de la tabla).
- Se agregó la **fecha de creación** de los registros al reporte: columnas "Creado" (createdAt) en Inventario, Donaciones, Vehículos y Finanzas; "Ingreso" (echaIngreso) en Personal.
- Verificado: 
pm run build éxito, 
pm test 61/61 passing.

## Reportes: centrado + logos fondo blanco (2026-10-23)

- Corregido el desplazamiento a la derecha en la impresión: se resetearon las animaciones/transform (nimate-page-enter, etc.) y 	ransform del <main> (Framer Motion) dentro de @media print en ReportePrintSheet.tsx.
- Los logos image-1.png / image-2.png ahora tienen **fondo blanco** (se procesaron para quitar el fondo negro) y se les aplica ackground: #fff.
- Se agregó salto de página limpio (	head repetido por página, page-break-inside: avoid en filas).
- Verificado: 
pm run build éxito, 
pm test passing.

## Reportes: donaciones DPI/NIT separados + emergencias personal asignado (2026-10-24)

- **Donaciones**: columna "DPI/NIT" dividida en dos columnas "DPI" y "NIT" (splitDpiNit: 13 dígitos → DPI, de lo contrario → NIT).
- **Emergencias**: se quitó la columna "Estado"; se agregaron "Personal asignado" (nombres con rol: piloto/camillero/etc.) y "Registrado por" (nombre completo de quien registró).
- Backend: EmergenciaListItemDto ahora incluye CreadoPorNombre y PersonalAsignadoResumen; el query de listado agrega creado_por_nombre (LEFT JOIN personal) y subconsulta personal_asignado_resumen (string_agg de servicio_personal_asignado + cat_roles_servicio).
- Frontend: EmergenciaListItem con creadoPorNombre y personalAsignadoResumen.
- Verificado: dotnet build 0 errores, 
pm run build éxito, 
pm test passing.

## Login obligatorio + Dashboard real + impresión profesional en todos los módulos (2026-10-24)

- **Login obligatorio**: AuthContext ya no restaura la sesión al arrancar; siempre inicia en el login y exige usuario/contraseña. Al montar limpia localStorage (user/role/modulos/permisos).
- **Dashboard (resumen general, visible para todos)**: nuevo GET /api/dashboard/resumen (DashboardController + DashboardService + DTOs/Dashboard/DashboardDtos.cs). Devuelve emergencias del mes (y mes anterior), personal, vehículos, donaciones del mes, incidentes por tipo, tendencia semanal (últimos 7 días) y últimos servicios.
  - Frontend: src/services/dashboardService.ts + src/types/dashboard.ts; App.tsx ahora consume datos reales (KPIs, gráficas de barras/área y tabla de últimos servicios). El item de navegación "Dashboard" se muestra a **todos** los usuarios (App.tsx incluye nalytics en el filtro de nav).
- **Impresión profesional unificada**:
  - Componente compartido src/app/components/print/PrintSheet.tsx (logos izquierda/derecha, membrete "SUBESTACIÓN 33", tabla tipo Excel centrada, salto de página limpio). Reportes ahora usa este componente.
  - usePrintList (hook) + PrintSheetHost (host oculto .print-only) reutilizables.
  - Se agregó botón "Imprimir" con hoja profesional en: **Finanzas**, **Donaciones** (registros), **Personal**, **Inventario** (items) y **Vehículos** (flota). Emergencias, Cupones y Mantenimiento ya tenían hoja dedicada.
- Verificado: dotnet build 0 errores, 
pm run build éxito, 
pm test passing.

## Impresión detallada + libro mensual + valorizado + detalle finanzas (2026-10-24)

- **Donaciones → Libro mensual**: el botón "Imprimir" ahora usa PrintSheet (tabla con membrete y logos) en vez de captura de pantalla.
- **Inventario → Valorizado**: el botón "Imprimir" ahora usa PrintSheet (tabla con logos y subtotales por categoría).
- **Impresión de un solo registro (ficha)** en todos los módulos (excepto cupones): nuevo PrintDetailSheet + usePrintDetail + PrintDetailHost (hoja retrato, tabla campo/valor, con logos). Aplicado a **Finanzas**, **Donaciones**, **Personal**, **Inventario** (item) y **Vehículos** (ficha). Emergencias ya tenía su formulario oficial.
- **Finanzas**: al hacer clic en la descripción se abre un **modal de detalle** con todos los datos del registro y acciones (Imprimir / Editar / Eliminar) dentro del modal.
- Verificado: 
pm run build éxito, 
pm test passing.

## Finanzas: detalle lateral + limpieza de acciones + fix warning Radix (2026-10-24)

- El detalle de una transacción ahora se abre como **Drawer lateral derecho** (igual que los demás módulos) en vez de modal centrado. Grid de campos responsivo (grid-cols-1 sm:grid-cols-2).
- Se **eliminó la columna "Acciones"** del DataTable de Finanzas; las acciones (Imprimir / Editar / Eliminar) quedan solo dentro del drawer de detalle. Se agregó onRowClick para abrir el detalle al hacer clic en cualquier fila (además de la descripción).
- Fix de warning de Radix Missing Description or aria-describedby: en ui/modal.tsx se agrega ria-describedby={undefined} cuando el modal no tiene descripción, evitando el warning sin romper los modales que sí tienen descripción.
- Verificado: 
pm run build éxito, 
pm test passing.

## Fix hoja en blanco en impresiones (2026-10-24)

- **Causa**: las hojas usaban ody * { visibility: hidden } (oculta pero conserva el espacio) + min-h-screen en la app, generando una página extra en blanco.
- **Solución**: migrar TODAS las hojas al patrón de portal + display: none.
  - Nuevo src/styles/print.css (importado en index.css): ody > *:not(.print-sheet):not(.print-area) { display: none } en impresión; .print-sheet/.print-area ocultas en pantalla y visibles en print.
  - PrintSheetHost/PrintDetailHost ahora renderizan vía createPortal(document.body) con clase print-sheet.
  - ReportesPage, CuponesTab y EmergenciasPage migrados a portal (print-sheet).
  - PrintSheet/PrintDetailSheet/ReporteCuponesPrintSheet y PRINT_CSS de emergencias limpiados: solo conservan @page (landscape/portrait) y page-break; se eliminó el patrón isibility/.print-only.
  - nimations.css: se quitó la regla .print-only/.srm-print-form de impresión.
  - Hooks usePrintList/usePrintDetail: limpian el state en fterprint para que solo exista una hoja montada a la vez.
- Diseño de Cupones y Emergencias **intacto** (solo cambió su mecanismo de aislamiento).
- Verificado: 
pm run build éxito, 
pm test passing.

## Mantenimiento: formulario + impresión desde Historial (2026-10-24)

- **Formulario (MantenimientoModal)**: se quitaron los campos "Firma del piloto" y "Firma del jefe de servicio" (ya no se capturan; backend los recibe nulos). "Horario de turno" ahora es un **rango** con dos selectores 	ype="time" (inicio y fin), guardado en horarioTurno como "HH:MM - HH:MM". Se quitó el botón "Imprimir" y el prop onPrint del formulario.
- **Hoja de impresión (MantenimientoPrintSheet)**: se agregaron las **2 imágenes superiores** (image-1 izquierda / image-2 derecha) y las firmas ahora aparecen como **línea en blanco** (para firma física), ya no muestran texto.
- **Historial (MantenimientoTab)**: onRowClick abre un **Drawer lateral izquierdo** con el detalle del mantenimiento y botones **Imprimir** y **Eliminar**. Se eliminó la columna "Acciones" del datatable.
- **VehiculosPage**: la impresión se dispara **directo** (brirImpresion → render en portal .print-area + window.print() con limpieza en fterprint). Se eliminó el MantenimientoPrintModal (vista previa) del flujo y el onPrint del modal.
- Cupones intacto. Verificado: 
pm run build éxito, 
pm test passing.
