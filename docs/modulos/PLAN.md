# PLAN MEJORAS PERMISOS MODULOS - Opción A (Por Roles)

> **Objetivo**: Agregar sistema de permisos de módulos a roles, con UI modal y endpoints backend. Sin romper login/actual funcional.
> **Stack**: React 18 + Tailwind v4 + .NET 8 + EF Core + Dapper + PostgreSQL
> **Basado en**: Roles existentes (admin, voluntario, secretario) + tabla `rol_modulo` nueva

---

## ESTADO ACTUAL

| Capa | Estado |
|------|--------|
| **BD** | Tablas: `roles`, `usuario_roles`, `permisos`, `rol_permisos`, `sesiones_activas`, `bitacora_accesos`. Sin tabla `cat_modulos` ni `rol_modulo`. |
| **Backend** | `AuthController.cs` con login, `HttpRequirePermissionAttribute` valida claims `permiso` en JWT. Sin endpoints de gestión de permisos. |
| **Frontend** | `AuthContext` con roles: `admin`, `voluntario`, `secretario`. Sidebar usa `ROLE_NAV[role]`. Sin UI de asignación de permisos. |
| **Módulos** | Tabla `cat_modulos` aún no creada/seed. A priori: Dashboard, Emergencias, Inventario, Finanzas, Donaciones, Vehículos, Reportes, Personal. |

---

## DISEÑO OPCIÓN A (Por Roles)

### 1. Nueva Estructura BD

**Tabla `cat_modulos`** (catálogo de módulos disponibles):
```sql
CREATE TABLE cat_modulos (
  modulo_id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  ruta VARCHAR(100) NOT NULL,
  icono VARCHAR(50) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Módulos por defecto (8 módulos):
INSERT INTO cat_modulos (nombre, ruta, icono) VALUES
  ('Dashboard', '/', 'Layout'),
  ('Emergencias', '/emergencias', 'Trash2'),
  ('Inventario', '/inventario', 'Box'),
  ('Finanzas', '/finanzas', 'Bank'),
  ('Donaciones', '/donaciones', 'Gift'),
  ('Vehículos', '/vehiculos', 'Truck'),
  ('Reportes', '/reportes', 'BarChart'),
  ('Personal', '/personal', 'Users');
```

**Tabla `rol_modulo`** (relación muchos-a-muchos rol-módulo):
```sql
CREATE TABLE rol_modulo (
  rol_id INT NOT NULL,
  modulo_id INT NOT NULL,
  PRIMARY KEY (rol_id, modulo_id),
  FOREIGN KEY (rol_id) REFERENCES roles(rol_id) ON DELETE CASCADE,
  FOREIGN KEY (modulo_id) REFERENCES cat_modulos(modulo_id) ON DELETE CASCADE
);

-- Asignaciones iniciales: admin tiene TODOS los módulos
INSERT INTO rol_modulo (rol_id, modulo_id) SELECT 1, modulo_id FROM cat_modulos;
-- Roles voluntario y secretario sin módulos asignados (o los que correspondan)
```

### 2. Endpoints Backend Nuevos

**POST /api/seguridad/permisos/asignar**
```csharp
[HttpPost("asignar")]
public async Task<IActionResult> AsignarModulos([FromBody] AsignarModuloDto dto) {
  using var transaction = await _context.Database.BeginTransactionAsync();
  try {
    // Quitar todos los módulos existentes del rol
    await _context.RolModulo.Where(rm => rm.RolId == dto.RolId).ExecuteDeleteAsync();
    // Asignar los nuevos módulos
    foreach (var moduloId in dto.ModuloIds) {
      await _context.RolModulo.AddAsync(new RolModulo {
        RolId = dto.RolId,
        ModuloId = moduloId
      });
    }
    await _context.SaveChangesAsync();
    await transaction.CommitAsync();
    return Ok(new { éxito = true, mensaje = "Permisos actualizados" });
  } catch {
    await transaction.RollbackAsync();
    return BadRequest(new { éxito = false, mensaje = "Error al actualizar permisos" });
  }
}

GET /api/seguridad/permisos/listar/{rolId:int}
public async Task<IActionResult> ListarModulos(int rolId) {
  var modulos = await _context.RolModulo
    .Where(rm => rm.RolId == rolId)
    .Select(rm => new {
      modulo_id = rm.ModuloId,
      nombre = rm.Modulo.Nombre,
      ruta = rm.Modulo.Ruta,
      icono = rm.Modulo.Icono
    })
    .ToListAsync();
  return Ok(modulos);
}
```

**DTOs**:
```csharp
public class AsignarModuloDto {
  public int RolId { get; set; }
  public List<int> ModuloIds { get; set; } = new();
}
```

### 3. Frontend - Modal PermissionModal

**Componente PermissionModal.tsx** (React):
```tsx
type Modulo = { id: number; nombre: string; ruta: string; icono: string; };

type PermissionModalProps = {
  rolId: number;
  rolNombre: string;
  onGuardar: (modulos: number[]) => void;
  onCancelar: () => void;
};

function PermissionModal({ rolId, rolNombre, onGuardar, onCancelar }: PermissionModalProps) {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  
  useEffect(() => {
    fetch(`/api/seguridad/permisos/listar/${rolId}`)
      .then(r => r.json())
      .then(setSeleccionados);
  }, [rolId]);
  
  useEffect(() => {
    fetch(`/api/seguridad/cat-modulos`) 
      .then(r => r.json())
      .then(setModulos);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm p-6">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Asignar Módulos</h3>
          <button onClick={onCancelar} className="text-gray-500">Cerrar</button>
        </div>

        <p className="text-sm text-gray-600 mb-4">Rol: {rolNombre}</p>

        <div className="space-y-2">
          {modulos.map(modulo => {
            const checked =seleccionados.includes(modulo.id);
            return (
              <div key={modulo.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-gray-100">
                  <{modulo.icono} className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium">{modulo.nombre}</span>
                <input
                  type="checkbox"
                  checked={seleccionados.includes(modulo.id)}
                  onChange={(e) => {
                    const nuevo =seleccionados.includes(modulo.id)
                      ?seleccionados.filter(id => id !== modulo.id)
                      :[...seleccionados, modulo.id];
                    setSeleccionados(nuevo);
                  }}
                  className="cursor-pointer accent-color-blue-600"
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-8 gap-3">
          <button onClick={onCancelar} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
          <button onClick={() => onGuardar(seleccionados)} className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90">
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 4. Frontend - Filtrado Sidebar

**En App.tsx** o componente sidebar:
```tsx
const { role } = useAuth();
// Obtener módulos permitidos desde API o estado
const [permitidosModulos, setPermitidosModulos] = useState<string[]>([]);

useEffect(() => {
  fetch(`/api/seguridad/permisos/listar/${role}`)
    .then(r => r.json())
    .then(setPermitidosModulos);
}, [role]);

// En el render del sidebar, filtrar navegación:
<nav>
  {ALL_NAV.filter(n => {
    // Siempre mostrar si es admin
    if (role === 'admin') return true;
    // Mostrar si rol tiene permiso de este módulo
    return permitidosModulos.includes(n.id);
  }).map(n => (...)}
</nav>
```

---

## PLAN DE IMPLEMENTACIÓN

### FASE 1: Base de Datos (1 tarea)
- Ejecutar SQL de creación de `cat_modulos` y `rol_modulo`
- Insertar 8 módulos por defecto
- Asignar todos los módulos al rol admin (rol_id = 1)
- Quitar todos los módulos de roles voluntario (2) y secretario (3)

### FASE 2: Backend (2 tareas)
1. Agregar controlador `SeguridadController.cs` con endpoints `asignar` y `listar`
2. Agregar DTOs `AsignarModuloDto`
3. Probar endpoints con Postman/Navicat

### FASE 3: Frontend (2 tareas)
1. Crear componente `PermissionModal.tsx` en `src/app/components/ui/`
2. Integrar en App.tsx o sidebar para mostrar/ocultar módulos según rol
3. Probar login con cada rol y verificar módulos visibles/ocultos

### FASE 4: Build Verification
- `dotnet ef migrations add PermissionModules`
- `dotnet ef database update`
- `npm run build` + `dotnet build` → 0 errores

---

## DECISIONES DISEÑO

| Decisión | Justificación |
|----------|---------------|
| **Permisos por roles** (Opción A) | Más sencillo, coherente con diseño actual de sidebar, suficiente para 3 roles (admin/voluntario/secretario) |
| **8 módulos por defecto** | Cubre todo el sistema actual: Dashboard, Emergencias, Inventario, Finanzas, Donaciones, Vehículos, Reportes, Personal |
| **Admin tiene todos** | Mantiene comportamiento anterior de admin sin restricciones |
| **Voluntario/Secretario sin módulos** | Por definir según política de acceso, pueden asignársele específicos después |
| **Modal React** | UI consistente con diseño actual (usar componentes premium: Modal, Button, Checkbox) |
| **Sin romper login** | La lógica actual de `ROLE_NAV[role]` se mantiene como fallback; los nuevos permisos son opcionales/extras |

---

## PROMPT PARA IA DE PAGO

> **Contexto**: ProyectoSub33 - Sistema bomberos. React 18 + Tailwind v4 + .NET 8 + EF Core + Dapper + PostgreSQL. Backend .NET (usar EF Core y Dapper, NO tocar: services, hooks, types del frontend ni login actual). El sistema ya tiene build passing y roles definidos (admin, voluntario, secretario).
>
> **Objetivo**: Implementar sistema de permisos de módulos por rol (Opción A). Crear tablas `cat_modulos` y `rol_modulo`, nuevos endpoints backend `/api/seguridad/permisos/*`, modal React PermissionModal para asignar módulos, filtrado sidebar por permisos. Sin romper login/actual funcional.
>
> **Reglas**: NO romper login/actual funcional. Usar base datos existente. Agregar 8 módulos por defecto. Admin tiene todos los módulos. Voluntario/secretario sin módulos asignados inicialmente. Build final: `npm run build` + `dotnet build` → 0 errores.
>
> **Checklist**:
> - [ ] Tabla `cat_modulos` con 8 módulos básicos (Dashboard, Emergencias, Inventario, Finanzas, Donaciones, Vehículos, Reportes, Personal)
> - [ ] Tabla `rol_modulo` relación muchos-a-muchos
> - [ ] Endpoint POST `/api/seguridad/permisos/asignar` para asignar módulos a rol
> - [ ] Endpoint GET `/api/seguridad/permisos/listar/{rolId}` para listar módulos por rol
> - [ ] DTO `AsignarModuloDto` con `RolId` y `ModuloIds`
> - [ ] Componente React `PermissionModal.tsx` con checkboxs de módulos
> - [ ] Filtrado sidebar `ALL_NAV` por permisos de rol (admin ve todos, otros solo los asignados)
> - [ ] Sin romper login actual, sidebar actual con `ROLE_NAV[role]`
> - [ ] `dotnet ef migrations add PermissionModules` + `dotnet ef database update`
> - [ ] `npm run build` + `dotnet build` → 0 errores
>
> **Pasos en order**:
> 1. Ejecutar SQL de creación de tablas y seed de módulos
> 2. Agregar Controlador `SeguridadController.cs`
> 3. Agregar DTOs `AsignarModuloDto`
> 4. Crear Componente `PermissionModal.tsx` React
> 5. Integrar filtrado en App.tsx/sidebar
> 6. Probar con los 3 roles
> 7. Build final verification

---

**Nota**: Este plan está diseñado para implementarse sobre la estructura existente sin necesidad de crear tablas de permisos por usuario (mucho más complejo). La asignación por roles es suficiente para el sistema actual y permite flexibilidad futura si se necesita permisos granulares por usuario.