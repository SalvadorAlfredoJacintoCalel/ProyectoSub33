# Contexto del Proyecto: Sub33 Configuración

## 1. Stack Tecnológico
- **Backend:** .NET 8, ASP.NET Core, EF Core, PostgreSQL (Npgsql)
- **Frontend:** React 18, Next.js 14 (App Router), TypeScript, Tailwind CSS
- **BD/ORM:** PostgreSQL + EF Core Code-First

## 2. Arquitectura y Módulos Activos
- **Clean Architecture ligera:** Controllers → Services → EF Core Entities
- **Módulo Configuración:** CRUD Listas Maestras + Categorías (jerarquía 1:N)
- **Auth:** JWT Bearer + Roles (Admin/Usuario)

## 3. Estado del Backend
### Archivos Clave
```
Backend_Sub33/Backend_Sub33/
├── Controllers/ConfiguracionController.cs
├── Services/ConfiguracionService.cs, IConfiguracionService.cs
├── DTOs/Configuracion/ (6 archivos: *Lista*Dto, *Categoria*Dto, Create/Update)
├── Models/Entities/CatCategoriaLista.cs, ConfiguracionListaMaestra.cs
├── Data/AppDbContext.cs
└── Program.cs
```

### Endpoints Activos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/configuracion/listas` | Lista completa con categoría + módulo |
| GET | `/api/configuracion/listas/{categoriaId}` | Filtrado por categoría |
| GET | `/api/configuracion/categorias` | Categorías con opciones anidadas |
| POST | `/api/configuracion/listas` | Crear opción (crea categoría si `CategoriaId=null`) |
| PUT | `/api/configuracion/opcion/{id}` | Actualizar opción + módulo |
| PUT | `/api/configuracion/categorias/{id}` | Actualizar nombre categoría |
| DELETE | `/api/configuracion/opcion/{id}` | Eliminar opción |
| DELETE | `/api/configuracion/categoria/{id}` | Eliminar categoría (cascade → opciones) |

### Modelos/BD
- **cat_categorias_listas**: `categoria_id (PK)`, `codigo`, `nombre`, `descripcion`, `created_at`
- **configuracion_listas_maestras**: `lista_id (PK)`, `categoria_id (FK, Cascade)`, `opcion`, `modulo (default 'GENERAL')`, `created_at`
- **Índice único**: `(categoria_id, opcion)`
- **Relación**: `Categoria.Opciones` (1:N, cascade delete)

## 4. Estado del Frontend
### Archivos Clave
```
src/
├── app/SeguridadPage.tsx          # Vista principal (acordeones por categoría)
└── services/configuracionService.ts  # Cliente API tipado
```

### Flujo de Datos
1. `SeguridadPage` carga `categorias` + `listasMaestras` al montar
2. UI: Acordeón por categoría → chips de opciones con badge `[MÓDULO]`
3. Acciones (crear/editar/eliminar) → `configuracionService` → API → Optimistic UI update → Recarga servidor
4. **Módulos soportados**: GENERAL, PERSONAL, EMERGENCIAS, VEHICULOS, INVENTARIO, FINANZAS, DONACIONES, REPORTES

## 5. Tareas Pendientes Inmediatas
- [ ] Ejecutar migración EF Core: `Add-Migration AddModuloAndCascadeDelete` + `Update-Database`
- [ ] Validar regla de unicidad: ¿permitir misma `opcion` en distintos `modulo` dentro de una categoría?
- [ ] Tests unitarios/integración para nuevos endpoints y servicio
- [ ] Frontend: Filtrado por módulo en UI, persistencia selección módulo por categoría
- [ ] Verificar `[Authorize]` cubre nuevos endpoints PUT/DELETE categoría