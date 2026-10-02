# ProyectoSub33 — Contexto para IA

## Stack Tecnológico
- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS 4
- **UI:** lucide-react (iconos), MUI 7, Radix UI
- **Backend:** .NET 8, ASP.NET Core, EF Core, PostgreSQL
- **API:** Fetch nativo con `apiClient` centralizado
- **Auth:** JWT Bearer + Roles (admin, voluntario, secretario)

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
│   │   ├── api/client.ts       # apiClient centralizado (get/post/put/delete)
│   │   ├── personalService.ts
│   │   ├── configuracionService.ts
│   │   └── authService.js
│   ├── types/                  # Tipos TypeScript compartidos
│   │   ├── api.ts              # ApiError, ApiErrorResponse, RequestOptions
│   │   └── personal.ts         # Miembro, FormState, RangoItem, RolItem
│   ├── constants/              # Constantes globales
│   │   ├── roles.ts            # ROLE_LABELS, ROLE_BADGE, ROLE_NAV
│   │   └── navigation.ts       # ALL_NAV, NavIconDef
│   ├── utils/                  # Utilidades
│   │   ├── format.ts           # formatDate()
│   │   └── formHelpers.ts      # emptyFormState, miembroToForm, formToMiembro
│   ├── context/AuthContext.tsx # useAuth() hook
│   └── main.tsx
│
├── Backend_Sub33/              ← BACKEND (.NET 8 + EF Core + PostgreSQL)
│   └── Backend_Sub33/
│       ├── Controllers/        # API controllers
│       ├── DTOs/               # Data Transfer Objects
│       ├── Models/             # EF Core entities
│       ├── Data/
│       │   ├── AppDbContext.cs
│       │   └── SQL/            # Scripts SQL (check_schema.sql, reset_db.sql)
│       └── Program.cs
│
├── CONTEXTO.md                 # Este archivo
├── contexto-personal.md        # Contexto específico del módulo Personal
├── guidelines/                 # Guías del proyecto
├── package.json                # Dependencias frontend
└── vite.config.ts              # Configuración Vite
```

## Módulos Activos
| Módulo | Página | Servicio | Descripción |
|--------|--------|----------|-------------|
| Personal | `PersonalPage.tsx` | `personalService.ts` | CRUD bomberos, rangos, roles |
| Vehículos | `VehiculosPage.tsx` | — | Flota, combustible, mantenimiento |
| Finanzas | `FinanzasPage.tsx` | — | Ingresos, gastos, caja chica |
| Inventario | `InventarioPage.tsx` | — | Insumos, equipo |
| Donaciones | `DonacionesPage.tsx` | — | Donaciones monetarias y materiales |
| Emergencias | `EmergenciasPage.tsx` | — | Registro de servicios |
| Reportes | `ReportesPage.tsx` | — | Gráficas y estadísticas |
| Seguridad | `SeguridadPage.tsx` | `configuracionService.ts` | Listas maestras, categorías |
| Perfil | `ProfilePage.tsx` | — | Perfil de usuario |
| Auth | `LoginPage.tsx` | `authService.js` | Login, roles |

## Patrones de Código

### Servicios API
```typescript
import { apiClient } from "./api/client";
export async function getPersonal(): Promise<PersonalResponse[]> {
  return apiClient.get<PersonalResponse[]>("/personal");
}
```

### Páginas
```typescript
export function PersonalPage() {
  const [members, setMembers] = useState<Miembro[]>([]);
  const [search, setSearch] = useState("");
  // ... filtros, paginación, modales
  return <PersonalTable members={members} ... />;
}
```

### Componentes
- Props tipadas con `interface`
- `useMemo` para filtrado
- `useState` para estado local
- Estilos con variables CSS (`var(--bg-input)`, `var(--text-1)`)

### Tipos
- Tipos compartidos en `src/types/`
- DTOs en archivos de servicio
- Props interfaces en componentes

## Convenciones
- **Nombres:** camelCase para variables/functions, PascalCase para componentes/types
- **Estilos:** Variables CSS (`var(--red)`, `var(--bg-input)`) + Tailwind para layout
- **Iconos:** lucide-react, tamaño 15-20px
- **Colores:** RED = "#D32F2F", variables CSS para tema
- **API:** `apiClient.get<T>(path)`, `apiClient.post<T>(path, body)`
- **Auth:** `useAuth()` hook → `{ user, role, login, logout }`

## Backend Endpoints (principales)
| Módulo | Endpoints |
|--------|-----------|
| Personal | `/api/personal`, `/api/personal/rangos`, `/api/personal/roles` |
| Configuración | `/api/configuracion/listas`, `/api/configuracion/categorias` |
| Emergencias | `/api/emergencias`, `/api/emergencias/siguiente-incidente` |

## Tareas Pendientes
- [ ] Conectar módulos Vehículos, Finanzas, Inventario, Donaciones, Emergencias, Reportes a backend
- [ ] Implementar autenticación real (actualmente token hardcodeado "dev-token")
- [ ] Mover URLs hardcodeadas a variables de entorno
- [ ] Dividir componentes gigantes (InventarioPage 1742 líneas, ReportesPage 1931 líneas)
- [ ] Agregar tests unitarios
- [ ] Implementar manejo de errores consistente (toast en lugar de console.error)

## Notas Importantes
- **NO usar Next.js** — el proyecto usa Vite
- **NO hardcodear URLs** — usar `import.meta.env.VITE_API_BASE_URL`
- **NO duplicar tipos** — usar `src/types/personal.ts`
- **NO duplicar constantes** — usar `src/constants/`
- **NO usar `any`** — tipar todo correctamente
- **NO eliminar código funcional** — refactorizar con cuidado
