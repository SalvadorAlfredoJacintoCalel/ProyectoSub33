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
│   ├── PersonalForm.tsx      # Formulario crear/editar (4 secciones + acordeón acceso)
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
| GET | `/api/personal/buscar?q=` | Búsqueda typeahead | ❌ Pendiente |

## Funciones Frontend (personalService.ts)

| Función | Endpoint | Uso |
|---------|----------|-----|
| `getRangos()` | GET /personal/rangos | Cargar select de rangos |
| `crearRango()` | POST /configuracion/rangos | Crear nuevo rango |
| `getRoles()` | GET /configuracion/roles | Cargar select de roles |
| `crearRol()` | POST /configuracion/roles | Crear nuevo rol |
| `getPersonal()` | GET /personal | Cargar lista |
| `buscarPersonal(q)` | GET /personal/buscar | Typeahead con debounce |
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

## Bug Crítico Detectado — Formulario Acceso al Sistema

### Problema
En `PersonalPage.tsx` `handleSubmit` (líneas 589-590, 608), la validación de credenciales es SIEMPRE obligatoria, aunque el acordeón "Acceso al Sistema" esté cerrado:

```tsx
// Línea 590: SIEMPRE requiere rolId (aunque el acordeón esté cerrado)
if (!form.rolId) errs.rolId = "Rol del sistema requerido";

// Línea 608: SIEMPRE requiere usuario y rolId
(errs.usuario || !form.usuario.trim() || !form.rolId)
```

**Resultado:** Es imposible registrar un miembro SIN acceso al sistema, aunque el acordeón esté cerrado.

### Comparación con DetailModal (editar) — Correcto
```tsx
// Solo validar credenciales si el acordeón está abierto
if (credOpen) {
  if (!form.usuario.trim()) errs.usuario = "Usuario requerido";
  if (!form.rolId) errs.rolId = "Rol del sistema requerido";
}
```

### Solución
En `handleSubmit` de `PersonalPage.tsx`:
```tsx
async function handleSubmit() {
  const errs: Record<string, string> = {};
  // Validaciones básicas (siempre)
  if (!form.primerNombre.trim()) errs.primerNombre = "Primer nombre requerido";
  if (!form.primerApellido.trim()) errs.primerApellido = "Primer apellido requerido";
  const dpiDigits = form.dpi.replace(/\D/g, "");
  if (dpiDigits.length !== 13) errs.dpi = "DPI debe tener exactamente 13 dígitos";
  if (!form.telefono.trim()) errs.telefono = "Teléfono requerido";
  if (!form.contactoEmergencia.trim()) errs.contactoEmergencia = "Nombre del contacto requerido";
  if (!form.telEmergencia.trim()) errs.telEmergencia = "Teléfono de emergencia requerido";
  if (form.rangoId === 0) errs.rangoId = "Rango requerido";

  // SOLO validar credenciales si el acordeón está abierto
  if (credOpen) {
    if (!form.usuario.trim()) errs.usuario = "Usuario requerido";
    if (!form.rolId) errs.rolId = "Rol del sistema requerido";
    if (!editingId && form.contrasena.length < 8) errs.contrasena = "Mínimo 8 caracteres";
    if (form.confirmarContrasena !== form.contrasena) errs.confirmarContrasena = "Las contraseñas no coinciden";
  }

  setErrors(errs);
  if (Object.keys(errs).length > 0) {
    toast.warning("Por favor completa los campos obligatorios (*).");
    return;
  }

  // ... payload
  // Solo enviar accesoSistema si el acordeón está abierto Y se llenaron credenciales
  if (credOpen && form.usuario && form.rolId) {
    payload.accesoSistema = {
      username: form.usuario,
      password: form.contrasena,
      rolId: form.rolId,
    };
  }
}
```

**El backend ya soporta esto** (`accesoSistema?: AccesoSistemaDto` es opcional en `personalService.ts`).

### Regla de Negocio
- **NO** dar acceso a todo el personal
- "Acceso al Sistema" es OPCIONAL:
  - Acordeón **cerrado** → guarda solo datos de personal (sin cuenta)
  - Acordeón **abierto** + campos llenos → guarda personal + cuenta de usuario
  - Acordeón **abierto** + campos vacíos → validar que completen usuario/rol/contraseña

---

## Mejoras Propuestas

### Backend (Prioridad Alta)
1. **Generación de código** — `PersonalListDto.Codigo` siempre vacío, implementar generación automática
2. **Búsqueda con filtros** — Agregar `GET /api/personal/buscar?termino=&rangoId=&estado=`
3. **Paginación** — Agregar `GET /api/personal?pagina=&tamanio=`
4. **Manejo de errores** — Usar códigos HTTP correctos (404, 409, 400) en lugar de 500 genérico

### BD (Prioridad Alta)
5. **Índices para búsqueda** — Crear índices en columnas de búsqueda:
```sql
CREATE INDEX idx_personal_nombre ON personal (primer_apellido, primer_nombre);
CREATE INDEX idx_personal_dpi ON personal (dpi);
CREATE INDEX idx_personal_codigo ON personal (codigo_bombero);
```

### Frontend (Prioridad Media)
6. **Eliminar `getPersonalById()`** — Función no usada
7. **Simplificar `mapListasToItems()`** — Helper genérico que maneja múltiples formatos
8. **Alinear DTOs** — `PersonalResponse` tiene campos que no vienen del backend (`codigo`, `correo`)
9. **Eliminar re-exports** — `export { ApiError }` y `export type { ApiErrorResponse }` innecesarios

### Frontend UI/UX (Prioridad Media)
10. **Typeahead con debounce** — Búsqueda en backend mientras se escribe (300ms debounce)
11. **Stat Cards con animación** — Hover: escala 1.05x + sombra más grande; Click: filtra directamente
12. **Dropdown estado personalizado** — Reemplazar `<select>` aburrido por dropdown moderno con colores y animación de flecha

---

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

## Plan: Separación Personal ↔ Configuración

### Objetivo
- **Personal** = cambios grandes: datos personales, crear/editar usuario + rol, activar/desactivar **personal**
- **Configuración** = cambios rápidos: cambiar rol, cambiar contraseña, activar/desactivar **cuenta**

### 1. Backend — PersonalService.cs

**Cambiar `ChangeEstadoAsync`:** Solo modifica `personal.estado` (NO toca `usuarios.estado`):
```csharp
public async Task<ServiceResult> ChangeEstadoAsync(Guid id, bool estado, CancellationToken ct = default)
{
    var personal = await _context.Personal.FirstOrDefaultAsync(p => p.PersonalId == id, ct);
    if (personal is null) return ServiceResult.NotFound("Personal no encontrado.");

    personal.Estado = estado;
    personal.UpdatedAt = DateTime.UtcNow;
    await _context.SaveChangesAsync(ct);
    return ServiceResult.Success();
}
```

**Agregar `ActualizarAccesoSistemaAsync`:** Actualiza username + password + rol:
```csharp
public async Task<ServiceResult> ActualizarAccesoSistemaAsync(Guid personalId, string username, string password, int rolId, CancellationToken ct = default)
{
    var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.PersonalId == personalId, ct);
    if (usuario is null) return ServiceResult.NotFound("Usuario no encontrado.");

    usuario.Username = username.ToLower();
    usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
    usuario.UpdatedAt = DateTime.UtcNow;

    var rolesActuales = await _context.UsuarioRoles.Where(ur => ur.UsuarioId == usuario.UsuarioId).ToListAsync(ct);
    _context.UsuarioRoles.RemoveRange(rolesActuales);
    _context.UsuarioRoles.Add(new UsuarioRol { UsuarioId = usuario.UsuarioId, RolId = rolId });

    await _context.SaveChangesAsync(ct);
    return ServiceResult.Success();
}
```

**Nuevo DTO en `DTOs/Personal/AccesoSistemaUpdateDto.cs`:**
```csharp
public class AccesoSistemaUpdateDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public int RolId { get; set; }
}
```

**Nuevo endpoint en PersonalController.cs:**
```csharp
[HttpPut("{id:guid}/acceso-sistema")]
public async Task<IActionResult> ActualizarAcceso(Guid id, [FromBody] AccesoSistemaUpdateDto dto, CancellationToken ct)
    => Respond(await _personalService.ActualizarAccesoSistemaAsync(id, dto.Username, dto.Password, dto.RolId, ct));
```

### 2. Frontend — PersonalPage.tsx (DetailModal)

**Mantener en formulario:**
- Select de rol (edita rol directamente)
- Acordeón "Acceso al Sistema" (usuario + contraseña)

**Quitar:**
- Botón "Desactivar" en DetailModal (ahora se gestiona en Configuración)

### 3. Frontend — SeguridadPage.tsx

**Tab "Usuarios y Roles" — Agregar:**
| Campo | Acción |
|-------|--------|
| Username | Botón "Cambiar" (modal con input) |
| Rol | Dropdown (ya existe) |
| Contraseña | Botón "Cambiar" (modal con input) |
| Estado | Toggle (ya existe) |

### 4. Flujo Final

```
Personal (cambios grandes):
  ├─ Editar datos personales ✓
  ├─ Editar rol (select en formulario) ✓
  ├─ Cambiar username + contraseña (acordeón) ✓
  └─ Activar/desactivar BOMBERO ✓

Configuración (cambios rápidos):
  ├─ Cambiar rol (dropdown en tabla) ✓
  ├─ Cambiar contraseña (modal rápido) ✓
  └─ Activar/desactivar CUENTA ✓
```

### 5. Verificación

- [ ] `PATCH /api/personal/{id}/estado` solo modifica `personal.estado`
- [ ] `PUT /api/personal/{id}/acceso-sistema` actualiza username + password + rol
- [ ] `PUT /api/configuracion/usuarios/{id}/estado` solo modifica `usuarios.estado`
- [ ] `PUT /api/configuracion/usuarios/{id}/rol` sigue funcionando
- [ ] PersonalPage DetailModal ya no tiene botón "Desactivar"
- [ ] SeguridadPage tiene modales para cambiar username y contraseña
- [ ] `dotnet build` ✅, `npm run build` ✅

---

## Tareas Pendientes
- [ ] Frontend: Agregar definición de `SectionLabel` en PersonalPage.tsx (error ReferenceError al editar miembro)
- [ ] Backend: Implementar generación de código automática
- [ ] Backend: Agregar endpoint de búsqueda con filtros
- [ ] Backend: Agregar paginación
- [ ] Backend: Mejorar manejo de errores
- [ ] BD: Crear índices para búsqueda (nombre, DPI, código)
- [ ] Frontend: Corregir validación formulario acceso al sistema (bug crítico)
- [ ] Frontend: Agregar typeahead con debounce
- [ ] Frontend: Stat Cards con animación hover + click para filtrar
- [ ] Frontend: Dropdown estado personalizado (reemplazar select aburrido)
- [ ] Frontend: Eliminar `getPersonalById()` no usado
- [ ] Frontend: Simplificar `mapListasToItems()`
- [ ] Frontend: Alinear DTOs con backend
- [ ] Frontend: Eliminar re-exports innecesarios
- [ ] Backend: Separar personal.estado de usuarios.estado
- [ ] Backend: Agregar endpoint PUT /api/personal/{id}/acceso-sistema
- [ ] Frontend: Quitar botón desactivar de DetailModal
- [ ] Frontend: Agregar modales cambio username/contraseña en SeguridadPage

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
