# ProyectoSub33 — Contexto Completo para IA

## Stack Tecnológico
- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS 4
- **UI:** lucide-react (iconos), MUI 7, Radix UI, recharts (gráficas)
- **Backend:** .NET 8, ASP.NET Core, EF Core, PostgreSQL
- **API:** Fetch nativo con `apiClient` centralizado (`src/services/api/client.ts`)
- **Auth:** JWT Bearer + Roles (admin, voluntario, secretario)
- **Gestión de estado:** React hooks + Context API
- **Validación:** React Hook Form + validación manual
- **Notificaciones:** sonner (toast)

## Estructura de Carpetas (Monorepo)
```
ProyectoSub33-main/
├── src/                        ← FRONTEND (Vite + React 18 + TypeScript)
│   ├── app/
│   │   ├── pages/              # 10 módulos (ver abajo)
│   │   ├── components/         # UI components (AlertDialog, figma/)
│   │   ├── layout/             # MainLayout, Sidebar, Topbar
│   │   └── App.tsx             # Router + dashboard principal
│   ├── services/
│   │   ├── api/client.ts       # apiClient centralizado (get/post/put/delete/patch)
│   │   ├── personalService.ts  # CRUD personal, rangos, roles
│   │   ├── configuracionService.ts # Parámetros, usuarios, roles, permisos, catálogos
│   │   ├── emergenciaService.ts    # Emergencias, catálogos emergencia
│   │   └── authService.js      # Login (legacy, no usado)
│   ├── types/                  # Tipos TypeScript compartidos
│   │   ├── api.ts              # ApiError, ApiErrorResponse, RequestOptions
│   │   ├── personal.ts         # Miembro, FormState, RangoItem, RolItem
│   │   └── emergencia.ts       # Emergencia, EmergenciaCreate, Paginacion, etc.
│   ├── constants/              # Constantes globales
│   │   ├── roles.ts            # ROLE_LABELS, ROLE_BADGE, ROLE_NAV
│   │   └── navigation.ts       # ALL_NAV, NavIconDef
│   ├── utils/                  # Utilidades
│   │   ├── format.ts           # formatDate()
│   │   └── formHelpers.ts      # emptyFormState, miembroToForm, formToMiembro
│   ├── context/AuthContext.tsx # useAuth() hook + AuthProvider
│   ├── hooks/useEmergencias.ts # Hook para manejo de emergencias
│   └── main.tsx                # Entry point
│
├── Backend_Sub33/              ← BACKEND (.NET 8 + EF Core + PostgreSQL)
│   └── Backend_Sub33/
│       ├── Controllers/        # 8 API controllers
│       ├── DTOs/               # Data Transfer Objects
│       ├── Models/             # EF Core entities (Personal, Usuario, etc.)
│       ├── Models/Entities/    # Catálogos (CatRango, CatTipoEmergencia, etc.)
│       ├── Services/           # Business logic (IPersonalService, etc.)
│       ├── Data/
│       │   ├── AppDbContext.cs # DbContext con todas las entidades
│       │   └── SQL/            # Scripts SQL (check_schema.sql, reset_db.sql)
│       ├── Common/             # ApiResponse, ServiceResult, PaginatedResult
│       ├── Attributes/         # HttpRequirePermissionAttribute
│       ├── Migrations/         # EF Core migrations
│       └── Program.cs          # Startup + DI + JWT + CORS
│
├── CONTEXTO.md                 # Este archivo
├── contexto-personal.md        # Contexto específico del módulo Personal
├── guidelines/                 # Guías del proyecto
├── package.json                # Dependencias frontend
├── vite.config.ts              # Configuración Vite
├── pnpm-workspace.yaml         # Workspace pnpm
├── poblar_catalogos_emergencia_v4.sql  # Datos semilla emergencias
├── reset_db.sql                # Script reset completo BD
└── README.md
```

## Módulos Activos (Frontend → Backend)
| Módulo | Página Frontend | Servicio Frontend | Controller Backend | Endpoints |
|--------|-----------------|-------------------|-------------------|-----------|
| **Personal** | `PersonalPage.tsx` | `personalService.ts` | `PersonalController` | `/api/personal`, `/api/personal/rangos`, `/api/personal/roles` |
| **Emergencias** | `EmergenciasPage.tsx`, `RegisterServicePage.tsx`, `EditServicePage.tsx` | `emergenciaService.ts` | `EmergenciasController` | `/api/emergencias`, `/api/emergencias/siguiente-incidente` |
| **Seguridad/Config** | `SeguridadPage.tsx` | `configuracionService.ts` | `ConfiguracionController` | `/api/configuracion/*` (parametros, usuarios, roles, permisos, catálogos) |
| **Auth** | `LoginPage.tsx` | `AuthContext` + `authService.js` | `AuthController` | `/api/auth/login` |
| **Vehículos** | `VehiculosPage.tsx` | — | — | Pendiente |
| **Finanzas** | `FinanzasPage.tsx` | — | — | Pendiente |
| **Inventario** | `InventarioPage.tsx` | — | — | Pendiente |
| **Donaciones** | `DonacionesPage.tsx` | — | — | Pendiente |
| **Reportes** | `ReportesPage.tsx` | — | — | Pendiente |
| **Perfil** | `ProfilePage.tsx` | — | — | Solo UI |

## Base de Datos (PostgreSQL) — Tablas Principales

### Configuración y Catálogos
| Tabla | Descripción | PK |
|-------|-------------|----|
| `configuracion_listas_maestras` | Listas maestras genéricas (categoría + opción) | `lista_id` |
| `parametros_sistema` | Parámetros clave-valor de la estación | `parametro_id` |
| `cat_rangos` | Rangos bomberiles (Bombero, Cabo, Sargento, etc.) | `rango_id` |
| `cat_tipos_emergencia` | Tipos de emergencia (24 tipos predefinidos) | `tipo_emergencia_id` |
| `cat_hospitales` | Hospitales de referencia | `hospital_id` |
| `cat_tipos_unidad` | Tipos de unidad (Ambulancia, Autobomba, etc.) | `tipo_unidad_id` |
| `cat_unidades` | Unidades físicas con placa, estado | `unidad_id` |
| `cat_roles_servicio` | Roles en servicio (Piloto, Socorrista, etc.) | `rol_servicio_id` |
| `cat_tipos_mantenimiento` | Tipos de mantenimiento vehículos | `tipo_mantenimiento_id` |

### Usuarios, Personal y Seguridad
| Tabla | Descripción | PK | FKs |
|-------|-------------|----|-----|
| `personal` | Bomberos (datos personales, DPI, rango, contacto emergencia) | `personal_id` (UUID) | `rango_id → cat_rangos` |
| `usuarios` | Cuentas de acceso al sistema | `usuario_id` (UUID) | `personal_id → personal` |
| `roles` | Roles del sistema (Admin, Voluntario, Secretario) | `rol_id` (int) | — |
| `permisos` | Permisos por módulo (código único) | `permiso_id` (UUID) | `modulo_id → cat_modulos` |
| `rol_permisos` | Matriz rol-permiso (M:N) | `(rol_id, permiso_id)` | `rol_id → roles`, `permiso_id → permisos` |
| `usuario_roles` | Roles de usuario (M:N) | `(usuario_id, rol_id)` | `usuario_id → usuarios`, `rol_id → roles` |
| `sesiones_activas` | Tokens JWT activos | `sesion_id` (UUID) | `usuario_id → usuarios` |
| `bitacora_accesos` | Log de ingresos | `bitacora_id` | `usuario_id → usuarios` |
| `codigos_recuperacion` | OTP recuperación contraseña | `codigo_id` | `usuario_id → usuarios` |

### Emergencias y Servicios
| Tabla | Descripción | PK | FKs |
|-------|-------------|----|-----|
| `emergencias_servicios` | Servicios de emergencia (incidente, paciente, unidad, hospital) | `servicio_id` (serial) | `tipo_emergencia_id`, `hospital_destino_id`, `formulado_por_id → personal` |
| `servicio_tipos_asistencia` | Tipos de asistencia por servicio (M:N) | `(servicio_id, tipo_asistencia)` | `servicio_id → emergencias_servicios` |
| `servicio_personal_asignado` | Personal asignado a servicio | `(servicio_id, nombre_personal)` | `servicio_id → emergencias_servicios`, `personal_id → personal` |
| `signos_vitales_paciente` | Signos vitales por servicio | `signo_id` | `servicio_id → emergencias_servicios` |
| `revision_nuevas_opciones` | Revisiones de nuevas opciones catálogos | `revision_id` | `servicio_id`, `atendido_por_usuario_id` |

## Backend Endpoints Detallados

### Personal (`/api/personal`)
```
GET    /api/personal?pagina=1&tamanio=10&rangoId=&estado=    → Lista paginada con filtros
GET    /api/personal/{id:guid}                                → Detalle por ID
POST   /api/personal                                          → Crear (CreatePersonalDto)
PUT    /api/personal/{id:guid}                                → Actualizar (UpdatePersonalDto)
PATCH  /api/personal/{id:guid}/estado                         → Cambiar estado (CambiarEstadoDto)
DELETE /api/personal/{id:guid}                                → Desactivar (soft delete)
```

### Configuración (`/api/configuracion`)
```
GET    /parametros                    → Parámetros estación
POST   /parametros                    → Guardar múltiples
PUT    /parametros/{clave}            → Actualizar uno
GET    /usuarios                      → Usuarios con rol
PUT    /usuarios/{id}/estado          → Activar/desactivar usuario
PUT    /usuarios/{id}/rol             → Asignar rol
GET    /roles                         → Lista roles sistema
POST   /roles                         → Crear rol
GET    /roles/{rolId}/permisos        → Matriz permisos rol
POST   /roles/{rolId}/permisos        → Guardar permisos rol
GET    /catalogos/{tipo}              → Catálogo genérico (rangos, tipos-emergencia, hospitales, etc.)
POST   /catalogos/{tipo}              → Crear en catálogo
PUT    /catalogos/{tipo}/{id}         → Actualizar catálogo
DELETE /catalogos/{tipo}/{id}         → Eliminar catálogo
GET    /rangos                        → Rangos (legacy compat)
POST   /rangos                        → Crear rango (legacy)
```

### Emergencias (`/api/emergencias`)
```
POST   /api/emergencias                    → Registrar emergencia (EmergenciaCreateDto)
GET    /api/emergencias/siguiente-incidente → Siguiente correlativo INC-YYYY-NNN
```

### Auth (`/api/auth`)
```
POST   /api/auth/login                    → Login (username + password) → JWT
```

## Patrones de Código Frontend

### API Client (`src/services/api/client.ts`)
```typescript
// Uso estándar
const data = await apiClient.get<T>("/endpoint");
const data = await apiClient.post<T>("/endpoint", body);
const data = await apiClient.put<T>("/endpoint", body);
const data = await apiClient.patch<T>("/endpoint", body);
await apiClient.delete<T>("/endpoint");

// Configuración
- Base URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5196/api"
- Token: localStorage.getItem("authToken")
- Headers: Content-Type: application/json + Authorization: Bearer <token>
- Error handling: ApiError class con status + data
```

### Servicios (ej. `personalService.ts`)
```typescript
// Envelope backend: { success, message, data }
interface BackendEnvelope<T> { success: boolean; message: string; data: T; }

// Llamadas tipadas
export const getPersonal = async (): Promise<PersonalResponse[]> => {
  const res = await apiClient.get<BackendEnvelope<PersonalResponse[]>>("/personal");
  return res.data; // o res.items si viene paginado
};
```

### Páginas (ej. `PersonalPage.tsx`)
```typescript
// Estado local
const [members, setMembers] = useState<Miembro[]>([]);
const [search, setSearch] = useState("");
const [filterRango, setFilterRango] = useState("");
const [page, setPage] = useState(1);

// useMemo para filtrado
const filtered = useMemo(() => members.filter(...), [members, search, filterRango]);

// Carga inicial
useEffect(() => { loadData(); }, []);

// Handlers async con try/catch + toast
const handleSubmit = async () => { ... };
```

### Componentes
- Props tipadas con `interface`
- `useMemo` para derivados, `useState` para estado local
- Estilos: Variables CSS (`var(--bg-input)`, `var(--text-1)`, `var(--red)`) + Tailwind para layout
- Iconos: `lucide-react`, tamaño 15-20px

### Tipos Compartidos (`src/types/`)
- `personal.ts`: `Miembro`, `FormState`, `RangoItem`, `RolItem`, `Estado`
- `emergencia.ts`: `Emergencia`, `EmergenciaCreate`, `EmergenciaUpdate`, `Paginacion`, `SignosVitales`, `PersonalAsignado`
- `api.ts`: `ApiError`, `ApiErrorResponse`, `RequestOptions`, `ApiClientConfig`

## Convenciones Estrictas
- **Nombres:** camelCase (vars/functions), PascalCase (componentes/types)
- **Estilos:** Variables CSS (`var(--red)`, `var(--bg-input)`) + Tailwind solo layout
- **Iconos:** `lucide-react`, 15-20px
- **Color principal:** RED = `#D32F2F` (definido en `constants/roles.ts` y `App.tsx`)
- **API:** `apiClient.get<T>(path)`, `apiClient.post<T>(path, body)` — **NO** fetch directo
- **Auth:** `useAuth()` hook → `{ user, role, login, logout, setRole }`
- **Tipos:** **NO** duplicar — usar `src/types/personal.ts` y `src/types/emergencia.ts`
- **Constantes:** **NO** duplicar — usar `src/constants/roles.ts` y `src/constants/navigation.ts`
- **URLs:** **NO** hardcodear — usar `import.meta.env.VITE_API_BASE_URL`
- **Tipado:** **NO** usar `any` — tipar todo correctamente
- **Código funcional:** **NO** eliminar — refactorizar con cuidado

## Autenticación y Autorización
- **JWT:** Bearer token en header `Authorization`
- **Roles:** `admin` | `voluntario` | `secretario` (definidos en `AuthContext.tsx`)
- **Navegación por rol:** `ROLE_NAV[role]` filtra items del sidebar
- **Permisos backend:** `HttpRequirePermissionAttribute` en controllers
- **Token storage:** `localStorage.authToken` + `localStorage.user` + `localStorage.userRole`
- **Login actual:** Token hardcodeado `"dev-token"` — **PENDIENTE** implementar real

## Datos Semilla (poblar_catalogos_emergencia_v4.sql)
- **24 tipos de emergencia** con colores hex y `requiere_unidad`
- **10 tipos de unidad** (Ambulancia, Autobomba, Rescate, etc.)
- **11 hospitales** (Sololá, Antigua, Chimaltenango, Quetzaltenango, Ciudad Guatemala)
- **10 unidades físicas** con códigos (A-33, B-12, R-5, E-44, BD-01, etc.) y placas BOM-XXX

## Tareas Pendientes (Priorizadas)
- [ ] **Conectar módulos Vehículos, Finanzas, Inventario, Donaciones, Reportes a backend**
- [ ] **Implementar autenticación real** (reemplazar token hardcodeado "dev-token")
- [ ] **Mover URLs hardcodeadas** a variables de entorno (`VITE_API_BASE_URL`)
- [ ] **Dividir componentes gigantes** (InventarioPage 1742 líneas, ReportesPage 1931 líneas)
- [ ] **Agregar tests unitarios** (Jest/Vitest + React Testing Library)
- [ ] **Implementar manejo de errores consistente** (toast sonner en lugar de console.error)
- [ ] **Paginación real en backend** para Emergencias (actualmente mock en frontend)
- [ ] **Validar DTOs backend** con DataAnnotations completos
- [ ] **Migraciones EF Core** para tablas faltantes (cat_unidades, cat_tipos_unidad, etc.)

## Archivos Clave para Referencia Rápida
| Archivo | Propósito |
|---------|-----------|
| `src/services/api/client.ts` | Cliente API centralizado |
| `src/context/AuthContext.tsx` | Auth state + login/logout |
| `src/types/personal.ts` | Tipos módulo Personal |
| `src/types/emergencia.ts` | Tipos módulo Emergencias |
| `src/constants/roles.ts` | Roles, labels, badges, nav permissions |
| `src/constants/navigation.ts` | Definición de navegación (ALL_NAV) |
| `Backend_Sub33/Data/AppDbContext.cs` | Esquema BD completo + relaciones |
| `Backend_Sub33/Controllers/PersonalController.cs` | Endpoints Personal |
| `Backend_Sub33/Controllers/ConfiguracionController.cs` | Endpoints Config + Catálogos genéricos |
| `Backend_Sub33/Controllers/EmergenciasController.cs` | Endpoints Emergencias + correlativo |
| `Backend_Sub33/Controllers/AuthController.cs` | Login JWT + BCrypt |
| `poblar_catalogos_emergencia_v4.sql` | Datos semilla catálogos emergencia |
| `reset_db.sql` | Script completo recrear BD |

## Notas Importantes para la IA
1. **NO usar Next.js** — el proyecto usa Vite + SPA
2. **NO hardcodear URLs** — usar `import.meta.env.VITE_API_BASE_URL`
3. **NO duplicar tipos** — centralizados en `src/types/`
4. **NO duplicar constantes** — centralizadas en `src/constants/`
5. **NO usar `any`** — TypeScript strict mode
6. **NO eliminar código funcional** — refactorizar con cuidado
7. **Backend usa Dapper + EF Core mixto** — Dapper para catálogos genéricos y queries complejas, EF Core para CRUD estándar
8. **PostgreSQL específico:** `gen_random_uuid()` para UUIDs, `TIMESTAMP WITH TIME ZONE`, `SERIAL` para IDs enteros
9. **Correlativo emergencias:** Formato `INC-YYYY-NNN` (ej: `INC-2026-017`), generado en backend
10. **Soft delete:** Personal se desactiva (`estado = false`), no se elimina físicamente