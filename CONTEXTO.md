# ProyectoSub33 — Contexto Completo para IA

> Última actualización: 2026-10-19 (mejoras del módulo Inventario, Fases 0–3).

## Stack Tecnológico
- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS 4
- **UI:** componentes propios (`src/app/components/ui`), Radix UI, lucide-react, MUI 7, recharts
- **Backend:** .NET 8, ASP.NET Core, **Dapper** (SQL directo) + PostgreSQL; EF Core para entidades/migraciones
- **API:** `apiClient` centralizado (`src/services/api/client.ts`), envelope `{ success, message, data }`
- **Auth:** JWT Bearer + Roles (admin, voluntario, secretario)
- **Estado:** React hooks + Context API
- **Validación:** manual por formulario (no React Hook Form en las páginas nuevas)
- **Notificaciones:** `useAlert()` (`alert`, `confirm`, `toast`) desde `src/app/components/ui/AlertSystem.tsx`

## Estructura de Carpetas (Monorepo)
```
ProyectoSub33-main/
├── src/                        ← FRONTEND (Vite + React 18 + TypeScript)
│   ├── app/
│   │   ├── pages/              # 10 módulos (ver abajo)
│   │   ├── components/         # UI components (ui/, figma/)
│   │   ├── layout/             # MainLayout, Sidebar, Topbar
│   │   └── App.tsx             # Router + dashboard principal
│   ├── services/
│   │   ├── api/client.ts       # apiClient centralizado (get/post/put/delete/patch)
│   │   ├── personalService.ts
│   │   ├── configuracionService.ts
│   │   ├── emergenciaService.ts
│   │   ├── inventarioService.ts
│   │   └── donacionService.ts
│   ├── types/                  # Tipos TypeScript compartidos (incluye inventario.ts, donacion.ts)
│   ├── hooks/                  # useEmergencias, useInventario
│   ├── constants/              # roles.ts, navigation.ts
│   ├── utils/                  # format.ts, formHelpers.ts
│   ├── context/AuthContext.tsx # useAuth() + AuthProvider
│   └── main.tsx                # Entry point
│
├── Backend_Sub33/              ← BACKEND (.NET 8 + Dapper + PostgreSQL)
│   └── Backend_Sub33/
│       ├── Controllers/        # Personal, Configuracion, Emergencias, Inventario, Donaciones, Auth, ...
│       ├── DTOs/               # DTOs por módulo (Inventario/Donaciones, etc.)
│       ├── Models/             # Entidades y catálogos
│       ├── Services/           # Lógica de negocio (InventarioService, DonacionService, ...)
│       ├── Data/               # AppDbContext + scripts SQL
│       ├── Common/             # ApiResponse, ServiceResult, PaginatedResult
│       ├── Attributes/         # HttpRequirePermissionAttribute
│       ├── Migrations/         # EF Core migrations
│       └── Program.cs          # Startup + DI + JWT + CORS
│
├── docs/modulos/inventario/    # Documentación y planes del módulo
├── CONTEXTO.md                 # Este archivo
├── package.json
├── vite.config.ts
├── reset_db.sql
└── README.md
```

## Módulos Activos (Frontend → Backend)
| Módulo | Página Frontend | Servicio Frontend | Controller Backend | Endpoints |
|--------|-----------------|-------------------|-------------------|-----------|
| **Personal** | `PersonalPage.tsx` | `personalService.ts` | `PersonalController` | `/api/personal`, `/api/personal/rangos`, `/api/personal/roles` |
| **Emergencias** | `EmergenciasPage.tsx`, `RegisterServicePage.tsx`, `EditServicePage.tsx` | `emergenciaService.ts` | `EmergenciasController` | `/api/emergencias`, `/api/emergencias/siguiente-incidente` |
| **Seguridad/Config** | `SeguridadPage.tsx` | `configuracionService.ts` | `ConfiguracionController` | `/api/configuracion/*` |
| **Auth** | `LoginPage.tsx` | `AuthContext` + `authService.js` | `AuthController` | `/api/auth/login` |
| **Inventario** | `InventarioPage.tsx`, `MovimientosPage.tsx`, `EquipoUnidadesPage.tsx`, `ServicioInsumosPage.tsx` | `inventarioService.ts` / `useInventario` | `InventarioController` | `/api/inventario/*` |
| **Donaciones** | `DonacionesPage.tsx` | `donacionService.ts` | `DonacionesController` | `/api/donaciones` |
| **Vehículos** | `VehiculosPage.tsx` | — | — | Pendiente |
| **Finanzas** | `FinanzasPage.tsx` | — | — | Pendiente |
| **Reportes** | `ReportesPage.tsx` | — | — | Pendiente |
| **Perfil** | `ProfilePage.tsx` | — | — | Solo UI |

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

### Usuarios, Personal y Seguridad
| Tabla | Descripción | PK | FKs |
|-------|-------------|----|-----|
| `personal` | Bomberos | `personal_id` (UUID) | `rango_id → cat_rangos` |
| `usuarios` | Cuentas de acceso | `usuario_id` (UUID) | `personal_id → personal` |
| `roles` | Roles del sistema | `rol_id` (int) | — |
| `permisos` | Permisos por módulo | `permiso_id` (UUID) | `modulo_id → cat_modulos` |
| `rol_permisos` | Matriz rol-permiso | `(rol_id, permiso_id)` | `rol_id`, `permiso_id` |
| `usuario_roles` | Roles de usuario | `(usuario_id, rol_id)` | `usuario_id`, `rol_id` |
| `sesiones_activas` | Tokens JWT activos | `sesion_id` (UUID) | `usuario_id → usuarios` |
| `bitacora_accesos` | Log de ingresos | `bitacora_id` | `usuario_id → usuarios` |
| `codigos_recuperacion` | OTP recuperación | `codigo_id` | `usuario_id → usuarios` |

### Emergencias y Servicios
| Tabla | Descripción | PK | FKs |
|-------|-------------|----|-----|
| `emergencias_servicios` | Servicios de emergencia | `servicio_id` (serial) | `tipo_emergencia_id`, `hospital_destino_id`, `formulado_por_id` |
| `servicio_tipos_asistencia` | Tipos de asistencia por servicio | `(servicio_id, tipo_asistencia)` | `servicio_id` |
| `servicio_personal_asignado` | Personal asignado | `(servicio_id, nombre_personal)` | `servicio_id`, `personal_id` |
| `signos_vitales_paciente` | Signos vitales | `signo_id` | `servicio_id` |
| `revision_nuevas_opciones` | Revisiones de catálogos | `revision_id` | `servicio_id`, `atendido_por_usuario_id` |

### Inventario y Donaciones
| Tabla | Descripción | PK | FKs |
|-------|-------------|----|-----|
| `inventario_items` | Insumos/equipos con stock | `item_id` | `categoria_inv_id`, `proveedor_id`, `donacion_id` |
| `inventario_movimientos` | Kardex de movimientos (cantidad firmada para ajustes) | `movimiento_id` | `item_id`, `tipo_mov_id`, `responsable_id → personal` |
| `equipo_unidades` | Equipo asignado a unidades | `(unidad_id, item_id)` | `unidad_id`, `item_id` |
| `servicio_insumos_utilizados` | Insumos consumidos en servicios | `(servicio_id, item_id)` | `servicio_id`, `item_id` |
| `donaciones` | Donaciones monetarias/material | `donacion_id` | — |
| `donacion_materiales` | Detalle de materiales donados | `material_id` | `donacion_id` |

## Backend Endpoints Detallados

### Personal (`/api/personal`)
```
GET    /api/personal?pagina=1&tamanio=10&rangoId=&estado=    → Lista paginada con filtros
GET    /api/personal/{id:guid}                                → Detalle por ID
POST   /api/personal                                          → Crear
PUT    /api/personal/{id:guid}                                → Actualizar
PATCH  /api/personal/{id:guid}/estado                         → Cambiar estado
DELETE /api/personal/{id:guid}                                → Desactivar (soft delete)
```

### Configuración (`/api/configuracion`)
```
GET    /parametros                    → Parámetros estación
POST   /parametros                    → Guardar múltiples
PUT    /parametros/{clave}            → Actualizar uno
GET    /usuarios                      → Usuarios con rol
PUT    /usuarios/{id}/estado          → Activar/desactivar
PUT    /usuarios/{id}/rol             → Asignar rol
GET    /roles                         → Lista roles
POST   /roles                         → Crear rol
GET    /roles/{rolId}/permisos        → Matriz permisos
POST   /roles/{rolId}/permisos        → Guardar permisos
GET    /catalogos/{tipo}              → Catálogo genérico
POST   /catalogos/{tipo}              → Crear catálogo
PUT    /catalogos/{tipo}/{id}         → Actualizar catálogo
DELETE /catalogos/{tipo}/{id}         → Eliminar catálogo
```

### Emergencias (`/api/emergencias`)
```
POST   /api/emergencias                     → Registrar emergencia (con insumosUtilizados[])
GET    /api/emergencias/siguiente-incidente → Siguiente correlativo INC-YYYY-NNN
```

### Inventario (`/api/inventario`)
```
GET    /api/inventario/items?pagina=&tamanio=&busqueda=&categoriaInvId=&stockStatus=
       → Lista paginada. stockStatus: "agotado" | "bajo" (filtro server-side)
GET    /api/inventario/items/{id}                     → Detalle por ID
POST   /api/inventario/items                          → Crear item (si stock > 0 registra ENTRADA "Stock inicial")
PUT    /api/inventario/items/{id}                     → Actualizar item
DELETE /api/inventario/items/{id}                     → Eliminar
GET    /api/inventario/movimientos?itemId=&tipoMovId=&desde=&hasta=  → Kardex paginado
POST   /api/inventario/movimientos                    → SOLO tipo AJUSTE (delta con signo, motivo y responsableId obligatorios)
GET    /api/inventario/movimientos/tipos              → Tipos manuales (solo AJUSTE)
GET    /api/inventario/equipo-unidades?unidadId=      → Equipo por unidad
POST   /api/inventario/equipo-unidades                → Asignar/actualizar equipo (upsert)
GET    /api/inventario/servicio-insumos?servicioId=   → Insumos por servicio (solo lectura)
GET    /api/inventario/resumen                        → KPIs (total, agotados, stock bajo, movimientos)
GET    /api/configuracion/catalogos/{tipo}            → Categorías, proveedores, tipos-movimiento, unidades
```

### Donaciones (`/api/donaciones`)
```
GET    /api/donaciones?tipo=&pagina=&tamanio=   → Lista paginada (Material | Monetaria)
GET    /api/donaciones/{id}                     → Detalle
POST   /api/donaciones                          → Crear (genera noRecibo si no se envía)
PUT    /api/donaciones/{id}                     → Actualizar
PATCH  /api/donaciones/{id}/estado              → Cambiar estado
DELETE /api/donaciones/{id}                     → Eliminar
```

### Auth (`/api/auth`)
```
POST   /api/auth/login   → Login (username + password) → JWT
```

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
interface ApiEnvelope<T> { success: boolean; message: string; data: T; }
```

### Layout y estilos
- Variables CSS: `var(--bg-page)`, `var(--bg-card)`, `var(--bg-input)`, `var(--bg-hover)`, `var(--text-1..3)`, `var(--border)`, `var(--brand-*)`, `var(--success-*)`, `var(--warning-*)`, `var(--info-*)`.
- Tailwind solo para layout (grid, flex, spacing, tipografía).
- Iconos `lucide-react` 13–20px.

### Componentes UI reutilizables
- `Button` (`variant`: brand, brand-outline, outline, ghost; `loading`).
- `Input`, `SelectField`, `FormErrorSummary`, `InfoField` (módulo Inventario).
- `Modal` (Radix `Dialog.Portal`, `z-[var(--z-modal)]` = 500) para formularios.
- `Drawer` (portal, `z-[var(--z-drawer)]` = 400) para detalle con `Tabs`.
- `DataTable` con paginación server-side, toolbar y `emptyState`.
- `AlertSystem`: `const { alert, confirm, toast } = useAlert();`
- **Gotcha:** `ModuleWrap` usa `animate-page-enter`, creando stacking context permanente; los overlays `fixed` inline quedan atrapados. Usar `Modal`/`Drawer` (portal) para overlays.

## Convenciones Estrictas
- **Nombres:** camelCase (vars/functions), PascalCase (componentes/types).
- **Estilos:** variables CSS + Tailwind solo layout.
- **API:** `apiClient` — **NO** fetch directo.
- **Auth:** `useAuth()` → `{ user, role, loggedIn, login, logout, setRole }`; `user.personalId` (UUID o null).
- **Tipos:** **NO** duplicar; usar `src/types/*`.
- **URLs:** **NO** hardcodear; usar `VITE_API_BASE_URL`.
- **Tipado:** **NO** usar `any`.
- **Código funcional:** **NO** eliminar; refactorizar con cuidado.
- **Comentarios:** no agregar comentarios nuevos en el código.
- **Datos en kardex:** `inventario_movimientos.cantidad` es `int` y admite negativos (delta de AJUSTE).

## Autenticación y Autorización
- JWT Bearer en `Authorization`.
- Roles: `admin` | `voluntario` | `secretario`.
- Navegación por rol: `ROLE_NAV[role]`.
- Permisos backend: `HttpRequirePermissionAttribute`.
- Storage: `localStorage.authToken` + `localStorage.user` + `localStorage.userRole`.
- Login actual: token de desarrollo — **PENDIENTE** auth real.

## Estado Actual — Módulo Inventario (actualizado 2026-10-19)

### Backend
| Archivo | Estado |
|---------|--------|
| `Models/Entities/InventarioItem.cs` | ✅ |
| `Models/Entities/InventarioMovimiento.cs` | ✅ (`Cantidad` int firmado) |
| `Models/Entities/EquipoUnidad.cs` | ✅ |
| `Models/Entities/ServicioInsumoUtilizado.cs` | ✅ |
| `DTOs/Inventario/InventarioDtos.cs` | ✅ (`InventarioItemFiltrosDto.StockStatus` agregado) |
| `Services/IInventarioService.cs` | ✅ |
| `Services/InventarioService.cs` | ✅ (Ajuste delta, ENTRADA inicial, filtro stock) |
| `Controllers/InventarioController.cs` | ✅ (`stockStatus` en `GetItems`) |
| `Services/DonacionService.cs` | ✅ (`MapearCategoria` corregido) |
| `Controllers/DonacionesController.cs` | ✅ |
| `Program.cs` | ✅ Servicios registrados |

### Frontend
| Archivo | Estado |
|---------|--------|
| `src/types/inventario.ts` | ✅ (`stockStatus` en filtros) |
| `src/services/inventarioService.ts` | ✅ |
| `src/hooks/useInventario.ts` | ✅ |
| `src/app/pages/Inventario/InventarioPage.tsx` | ✅ 4 pestañas; Kardex/Ubicaciones reales; KPIs filtrables; sin print |
| `src/app/pages/Inventario/MovimientosPage.tsx` | ✅ Solo lectura + Ajuste; `tipoMeta` exportado |
| `src/app/pages/Inventario/EquipoUnidadesPage.tsx` | ✅ Tarjetas por unidad + Drawer + validación de stock |
| `src/app/pages/Inventario/ServicioInsumosPage.tsx` | ✅ Tarjetas + Drawer; sin print |
| `src/app/pages/Donaciones/DonacionesPage.tsx` | ✅ Conectado al backend; sin print |

### Mejoras aplicadas (2026-10-19)
1. **Equipo en Unidades:** rediseñado a tarjetas por unidad con nombre, filtros (búsqueda por item y unidad), Drawer con detalle y edición de cantidades; aviso cuando la suma asignada excede el stock.
2. **Items:** la sección Proveedor se oculta cuando `origen === "Donado"`; se eliminó el `noRecibo` aleatorio y se exigen DPI/NIT y teléfono en la donación rápida.
3. **Movimientos:** página de solo lectura (kardex) + botón **Ajuste de Inventario**; el backend acepta únicamente AJUSTE con delta firmado, motivo y `responsableId` obligatorios; rechaza dejar stock negativo o delta cero.
4. **Kardex:** al crear un item con stock inicial se registra automáticamente un movimiento ENTRADA con motivo "Stock inicial".
5. **Detalle de item:** pestañas Kardex (últimos 50 movimientos) y Ubicaciones (unidades y servicios) con datos reales; se eliminó la pestaña Acciones duplicada.
6. **KPIs:** "Agotados" y "Stock bajo" navegan a Items con filtro server-side (`stockStatus`) y chip para quitarlo.
7. **Donaciones:** `MapearCategoria("Equipo/Herramientas")` ahora devuelve `"Equipo de Rescate"`.
8. **Limpieza:** se eliminaron los `window.print()` del módulo (Items, Movimientos, Equipo, ServicioInsumos) y de Donaciones.
9. Se eliminó el caso muerto `TRANSFERENCIA` de `tipoMeta`.

### Catálogos en Configuración
- `categorias-inventario` → `cat_categorias_inventario`
- `proveedores` → `cat_proveedores`
- `tipos-movimiento` → `cat_tipos_movimiento`
- `unidades` → `cat_unidades`

### Datos Semilla
- `docs/modulos/inventario/datos_inventario.sql` → categorías, proveedores, tipos de movimiento, unidades e items.

## Documentación del Módulo
| Archivo | Propósito |
|---------|-----------|
| `docs/modulos/inventario/INVENTARIO.md` | Análisis completo del módulo |
| `docs/modulos/inventario/PLAN_INVENTARIO_MEJORAS.md` | Plan de mejoras Fases 0–3 (implementado) |
| `docs/modulos/inventario/PLAN_INVENTARIO_DONACIONES.md` | Integración Inventario ↔ Donaciones |
| `docs/modulos/inventario/PLAN_INSUMOS_EMERGENCIAS.md` | Insumos en Emergencias → Inventario |
| `docs/modulos/inventario/datos_inventario.sql` | Datos semilla |
| `docs/modulos/inventario/migracion_donaciones.sql` | Migración integración donaciones |

## Tareas Pendientes (Priorizadas)
- [x] Conectar módulo Inventario a backend.
- [x] Conectar módulo Donaciones a backend.
- [x] Integración Inventario ↔ Donaciones (Material).
- [x] Insumos en Servicios → Inventario (solo lectura).
- [x] Plan de mejoras de flujos y UX del Inventario.
- [ ] Conectar módulos Vehículos, Finanzas y Reportes a backend.
- [ ] Implementar autenticación real (reemplazar token de desarrollo).
- [ ] Mover URLs hardcodeadas a `VITE_API_BASE_URL`.
- [ ] Dividir componentes gigantes (`InventarioPage`, `ReportesPage`).
- [ ] Agregar tests unitarios (Vitest + React Testing Library).
- [ ] Manejo de errores consistente en todos los módulos.
- [ ] Paginación real en backend para Emergencias.
- [ ] Validar DTOs backend con DataAnnotations completos.
- [ ] Migraciones EF Core para tablas faltantes.
- [ ] Implementar impresión por contenido (reemplazar `window.print()` global en módulos restantes).

## Archivos Clave para Referencia Rápida
| Archivo | Propósito |
|---------|-----------|
| `src/services/api/client.ts` | Cliente API centralizado |
| `src/context/AuthContext.tsx` | Auth state + `useAuth()` |
| `src/types/inventario.ts` | Tipos del módulo Inventario |
| `src/types/donacion.ts` | Tipos del módulo Donaciones |
| `src/constants/roles.ts` | Roles, labels, badges, navegación |
| `src/constants/navigation.ts` | Navegación (`ALL_NAV`) |
| `Backend_Sub33/Backend_Sub33/Services/InventarioService.cs` | Lógica de inventario (kardex, ajustes, filtros) |
| `Backend_Sub33/Backend_Sub33/Services/DonacionService.cs` | Lógica de donaciones |
| `Backend_Sub33/Backend_Sub33/Controllers/InventarioController.cs` | Endpoints Inventario |
| `Backend_Sub33/Backend_Sub33/Controllers/DonacionesController.cs` | Endpoints Donaciones |
| `Backend_Sub33/Backend_Sub33/DTOs/Inventario/InventarioDtos.cs` | DTOs de Inventario |
| `docs/modulos/inventario/PLAN_INVENTARIO_MEJORAS.md` | Plan de mejoras implementado |
| `reset_db.sql` | Recrear BD completa |

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

> Nota: los únicos warnings actuales del backend son 2 preexistentes en `PersonalService.cs` (CS8619, líneas 777/791).
