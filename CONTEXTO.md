# ProyectoSub33 — Contexto Completo para IA

> Última actualización: **2026-10-21** (permisos de módulos por usuario, navegación por permisos, se elimina "Vista de Rol" y borradores sin alerta falsa).
> Este archivo es la fuente de contexto del proyecto. Mantenerlo actualizado al cerrar cada bloque de trabajo.

## Resumen Ejecutivo

- **Módulos conectados a backend:** Auth, Personal, Emergencias, Seguridad/Configuración, Inventario, Donaciones (incluye Libro mensual) y Vehículos (incluye Mantenimientos y Cupones).
- **Módulos solo UI / datos mock:** Finanzas, Reportes y Perfil.
- **Estado de compilación:** `npm run build` y `dotnet build` pasan correctamente al 2026-10-20.
- **Backend:** debe compilarse y dejarse **detenido** al terminar. Puerto esperado: `5196`.
- **Regla UX clave:** el detalle de un KPI de Vehículos **no abre modal ni tabla**; actualiza las tarjetas de flota en la misma vista.

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
│   │   └── App.tsx              # Router + dashboard principal
│   ├── services/
│   │   ├── api/client.ts        # apiClient centralizado
│   │   ├── authService.js
│   │   ├── personalService.ts
│   │   ├── configuracionService.ts
│   │   ├── seguridadService.ts
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
│   │   └── useFormDraft.ts      # autoguardado de borradores a localStorage
│   ├── types/                   # api, personal, emergencia, inventario, donacion, vehiculos
│   ├── constants/               # roles.ts, navigation.ts
│   ├── utils/                   # format.ts, formHelpers.ts
│   ├── context/AuthContext.tsx  # useAuth() + AuthProvider
│   └── main.tsx
│
├── Backend_Sub33/
│   └── Backend_Sub33/
│       ├── Controllers/         # Auth, Personal, Configuracion, Seguridad, Emergencias,
│       │                        # Inventario, Donaciones, DonacionLibro, Vehiculos, Cupones
│       ├── DTOs/                # Por módulo (Inventario, Donacion, Vehiculos, etc.)
│       ├── Models/              # Entidades y catálogos
│       ├── Services/            # Lógica de negocio
│       ├── Data/                # AppDbContext + scripts SQL
│       ├── Common/              # ApiResponse, ServiceResult, PaginatedResult
│       ├── Attributes/          # HttpRequirePermissionAttribute
│       ├── Migrations/          # EF Core migrations
│       └── Program.cs           # Startup + DI + JWT + CORS
│
├── docs/modulos/
│   ├── inventario/
│   ├── emergencias/
│   └── vehiculos/
│       └── migracion_vehiculos.sql
├── CONTEXTO.md                  # Este archivo
├── package.json
├── vite.config.ts
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

### Usuarios, Personal y Seguridad

| Tabla | Descripción | PK | FKs |
|-------|-------------|----|-----|
| `personal` | Bomberos | `personal_id` (UUID) | `rango_id → cat_rangos` |
| `usuarios` | Cuentas de acceso | `usuario_id` (UUID) | `personal_id → personal` |
| `roles` | Roles del sistema | `rol_id` (int) | — |
| `permisos` | Permisos por módulo | `permiso_id` (UUID) | `modulo_id → cat_modulos` |
| `rol_permisos` | Matriz rol-permiso | `(rol_id, permiso_id)` | `rol_id`, `permiso_id` |
| `rol_modulo` | Módulos por rol | `(rol_id, modulo_id)` | `rol_id`, `modulo_id` |
| `usuario_roles` | Roles de usuario | `(usuario_id, rol_id)` | `usuario_id`, `rol_id` |
| `usuario_modulos` | Módulos por usuario (override del rol) | `(usuario_id, modulo_id)` | `usuario_id → usuarios`, `modulo_id → cat_modulos` |
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
GET    /api/vehiculos/cupones/periodos/{anio:int}/{mes:int}  → Periodo + cupones
PUT    /api/vehiculos/cupones/periodos                       → Guardar/actualizar periodo
POST   /api/vehiculos/cupones                                → Crear cupón
PUT    /api/vehiculos/cupones/{id:int}                       → Actualizar cupón
DELETE /api/vehiculos/cupones/{id:int}                       → Eliminar cupón
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
- **API:** `apiClient` — **NO** fetch directo (excepto `authService.js`, pendiente de migrar).
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
- Login: **conectado a `/api/auth/login`**; `authService.js` usa `VITE_API_BASE_URL`.
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

---

## Tareas Pendientes (Priorizadas)

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
- [ ] Conectar módulos Finanzas y Reportes a backend.
- [ ] Crear endpoint de resumen de Vehículos para no depender de cargar 500 registros.
- [ ] Implementar recuperación de contraseña/OTP real.
- [ ] Mover URL hardcodeada de `authService.js` a `VITE_API_BASE_URL`.
- [ ] Dividir componentes gigantes (`InventarioPage`, `VehiculosPage`, `ReportesPage`).
- [ ] Agregar tests unitarios (Vitest + React Testing Library).
- [ ] Manejo de errores consistente en todos los módulos.
- [ ] Paginación real en backend para Emergencias.
- [ ] Validar DTOs backend con DataAnnotations completos.
- [ ] Migraciones EF Core para tablas faltantes.
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

# Backend
cd Backend_Sub33/Backend_Sub33
dotnet build           # Debe compilar sin errores

# Si el proceso Backend_Sub33 está corriendo y bloquea el .exe:
dotnet build -p:OutDir=C:\Users\PC\AppData\Local\Temp\opencode\bsout\

# Base de datos
dotnet ef database update
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
- **Auth:** el login ya usa backend, pero la URL sigue hardcodeada en `authService.js`.
- **Consola PowerShell:** los acentos pueden verse corruptos; los archivos están en UTF-8.

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
