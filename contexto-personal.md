# Módulo Personal — Contexto Compacto

## Información General
- **Módulo:** Personal (Bomberos)
- **Descripción:** CRUD completo de bomberos con rangos, roles y credenciales de acceso
- **Estado:** Funcional, conectado a backend
- **Prioridad:** Módulo principal del sistema

## Archivos Clave

### Frontend
```
src/app/pages/Personal/
├── PersonalPage.tsx          # Página principal (lista, filtros, paginación, modales)
├── components/
│   ├── PersonalForm.tsx      # Formulario crear/editar (4 secciones)
│   └── PersonalTable.tsx     # Tabla con acciones
src/services/personalService.ts  # Cliente API (8 funciones)
src/types/personal.ts           # Tipos: Miembro, FormState, RangoItem, RolItem
src/utils/formHelpers.ts        # emptyFormState, miembroToForm, formToMiembro
src/utils/format.ts             # formatDate()
```

### Backend
```
Backend_Sub33/Backend_Sub33/
├── Controllers/PersonalController.cs   # 7 endpoints
├── DTOs/PersonalDto.cs                 # 7 DTOs
├── Models/Personal.cs                  # Entidad principal
├── Models/Entities/CatRango.cs         # Catálogo de rangos
└── Data/AppDbContext.cs                # DbContext
```

## Endpoints Backend

| Método | Ruta | Descripción | Estado |
|--------|------|-------------|--------|
| GET | `/api/personal` | Lista todos (filtro `soloActivos`) | ✅ |
| GET | `/api/personal/rangos` | Lista rangos | ✅ |
| GET | `/api/personal/{id}` | Obtener por ID | ✅ |
| POST | `/api/personal` | Crear | ✅ |
| PUT | `/api/personal/{id}` | Actualizar | ✅ |
| PATCH | `/api/personal/{id}/estado` | Cambiar estado | ✅ |
| DELETE | `/api/personal/{id}` | Soft delete | ✅ |

## Funciones Frontend (personalService.ts)

| Función | Endpoint | Uso |
|---------|----------|-----|
| `getRangos()` | GET /personal/rangos | Cargar select de rangos |
| `crearRango()` | POST /configuracion/rangos | Crear nuevo rango |
| `getRoles()` | GET /configuracion/roles | Cargar select de roles |
| `crearRol()` | POST /configuracion/roles | Crear nuevo rol |
| `getPersonal()` | GET /personal | Cargar lista |
| `registrarPersonal()` | POST /personal | Crear miembro |
| `actualizarPersonal()` | PUT /personal/{id} | Editar miembro |
| `eliminarPersonal()` | DELETE /personal/{id} | Eliminar miembro |
| `getPersonalById()` | GET /personal/{id} | ⚠️ NO USADO |

## Estructura de Datos

### Miembro (frontend)
```typescript
interface Miembro {
  id: string;
  codigo: string;
  nombre: string;
  dpi: string;
  rangoId: number;
  rango: string;
  estado: "Activo" | "Inactivo";
  telefono: string;
  contactoEmergencia: string;
  telEmergencia: string;
  fechaIngreso: string;
}
```

### PersonalListDto (backend)
```csharp
public class PersonalListDto {
  public string Id { get; set; }
  public string Codigo { get; set; }  // ⚠️ Siempre vacío
  public string Nombre { get; set; }
  public string Dpi { get; set; }
  public int? RangoId { get; set; }
  public string? Rango { get; set; }
  public string Estado { get; set; }
  public string Telefono { get; set; }
  public string ContactoEmergencia { get; set; }
  public string TelEmergencia { get; set; }
  public string FechaIngreso { get; set; }
  public string? Usuario { get; set; }
  public int? RolId { get; set; }
  public string? Rol { get; set; }
}
```

## Mejoras Necesarias

### Backend (Prioridad Alta)
1. **Generación de código** — `PersonalListDto.Codigo` siempre vacío, implementar generación automática
2. **Búsqueda con filtros** — Agregar `GET /api/personal/buscar?termino=&rangoId=&estado=`
3. **Paginación** — Agregar `GET /api/personal?pagina=&tamanio=`
4. **Manejo de errores** — Usar códigos HTTP correctos (404, 409, 400) en lugar de 500 genérico

### Frontend (Prioridad Media)
5. **Eliminar `getPersonalById()`** — Función no usada
6. **Simplificar `mapListasToItems()`** — Helper genérico que maneja múltiples formatos
7. **Alinear DTOs** — `PersonalResponse` tiene campos que no vienen del backend (`codigo`, `correo`)
8. **Eliminar re-exports** — `export { ApiError }` y `export type { ApiErrorResponse }` innecesarios

## Convenciones del Módulo

### Frontend
- **Estilos:** Variables CSS (`var(--bg-input)`, `var(--text-1)`) + Tailwind para layout
- **Iconos:** lucide-react, tamaño 15-20px
- **Colores:** RED = "#D32F2F", variables CSS para tema
- **Componentes:** Props tipadas con `interface`, `useMemo` para filtrado
- **API:** `apiClient.get<T>(path)`, `apiClient.post<T>(path, body)`

### Backend
- **Patrón:** Controller → AppDbContext (sin capa de servicios)
- **ORM:** EF Core con Data Annotations
- **Auth:** JWT Bearer + Roles
- **DTOs:** Separados por operación (Crear, Actualizar, Listar)
- **Validación:** Data Annotations en DTOs

## Notas Importantes
- **NO romper diseño CSS** — mantener variables CSS y estilos existentes
- **NO cambiar estructura de carpetas** — mantener organización actual
- **NO eliminar código funcional** — solo refactorizar con cuidado
- **NO usar `any`** — tipar todo correctamente
- **NO hardcodear URLs** — usar `import.meta.env.VITE_API_BASE_URL`
- **NO duplicar tipos** — usar `src/types/personal.ts`
- **NO duplicar constantes** — usar `src/constants/`

## Tareas Pendientes
- [ ] Backend: Implementar generación de código automática
- [ ] Backend: Agregar endpoint de búsqueda con filtros
- [ ] Backend: Agregar paginación
- [ ] Backend: Mejorar manejo de errores
- [ ] Frontend: Eliminar `getPersonalById()` no usado
- [ ] Frontend: Simplificar `mapListasToItems()`
- [ ] Frontend: Alinear DTOs con backend
- [ ] Frontend: Eliminar re-exports innecesarios

## Esquema de Base de Datos — Módulo Personal y Seguridad

El backend debe reflejar las siguientes tablas e integraciones de PostgreSQL (EF Core Models / DbContext):

### 1. Tabla Principal: `personal`
- **PK:** `personal_id` (UUID, default `gen_random_uuid()`)
- **Campos:**
  - `primer_nombre` (VARCHAR 50, NOT NULL)
  - `segundo_nombre` (VARCHAR 50, NULL)
  - `primer_apellido` (VARCHAR 50, NOT NULL)
  - `segundo_apellido` (VARCHAR 50, NULL)
  - `dpi` (VARCHAR 20, NOT NULL, UNIQUE)
  - `fecha_nacimiento` (DATE, NULL)
  - `rango_id` (INT, FK -> `cat_rangos.rango_id` ON DELETE SET NULL)
  - `fecha_ingreso` (DATE, NOT NULL)
  - `telefono` (VARCHAR 20, NOT NULL)
  - `estado` (BOOLEAN, DEFAULT true, NOT NULL)
  - `contacto_emergencia_nombre` (VARCHAR 100, NOT NULL)
  - `contacto_emergencia_telefono` (VARCHAR 20, NOT NULL)
  - `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE)

### 2. Catálogos y Tablas Relacionadas:
- **`cat_rangos`**: `rango_id` (PK, SERIAL), `rango` (VARCHAR 50, UNIQUE), `descripcion`, `activo` (BOOL).
- **`direcciones_personal`**: `direccion_id` (PK), `personal_id` (FK UNIQUE -> `personal`, CASCADE), `departamento`, `municipio`, `zona`, `direccion_detalle`.
- **`cat_especialidades`** y **`personal_especialidades`**: Tabla pivote N:M (`personal_id`, `especialidad_id`, `fecha_acreditacion`).
- **`usuarios`**: `usuario_id` (UUID), `personal_id` (FK UNIQUE -> `personal`, CASCADE), `username` (UNIQUE), `password_hash`, `estado` (BOOL).
- **`roles`**, **`permisos`**, **`rol_permisos`**, **`usuario_roles`**: Matriz de permisos RBAC para autenticación JWT.

### Reglas para la Capa Backend (.NET 8 EF Core)
1. **Transaccionalidad en Guardado:** El endpoint `POST /api/personal` debe permitir crear el registro en `personal` y, si se proporcionan datos de acceso, crear simultáneamente la cuenta en `usuarios` y asignar `usuario_roles`.
2. **Generación de Código:** Concatenar las iniciales o ID incremental para generar el código dinámico en el DTO de respuesta.
3. **Mapeo DTO <-> Entity:** Utilizar un mapeador explícito o AutoMapper respetando los nombres camelCase para la API JSON.
