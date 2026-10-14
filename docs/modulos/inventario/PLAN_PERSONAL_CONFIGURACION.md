# PLAN: Personal ↔ Configuración + Optimizaciones UI

## Objetivo
Separar responsabilidades entre módulos, optimizar búsqueda, y profesionalizar catálogos con modales dinámicos. No dañar nada existente.

---

## 📁 UBICACIONES EXACTAS

| Módulo | Archivos |
|--------|----------|
| Personal Frontend | `src/app/pages/Personal/PersonalPage.tsx`, `src/app/pages/Personal/components/PersonalForm.tsx` |
| Personal Service | `Backend_Sub33/Backend_Sub33/Services/PersonalService.cs` |
| Personal Controller | `Backend_Sub33/Backend_Sub33/Controllers/PersonalController.cs` |
| Configuración Frontend | `src/app/pages/Seguridad/SeguridadPage.tsx` |
| Configuración Service | `src/services/configuracionService.ts` |
| Configuración Backend | `Backend_Sub33/Backend_Sub33/Controllers/ConfiguracionController.cs` |
| Tipos | `src/types/emergencia.ts`, `src/types/personal.ts`, `src/types/inventario.ts` |
| Hooks | `src/hooks/useEmergencias.ts`, `src/hooks/useInventario.ts` |

---

## REGLAS NO NEGOCIABLES

- NO tocar módulos: Emergencias, Inventario, Donaciones, Vehículos, Auth, Reportes
- NO usar `any`, NO fetch directo, NO hardcodear URLs
- NO dejar `dotnet run`, `npm run dev` ni `dotnet watch` corriendo al final
- NO eliminar código funcional — solo extender
- NO tocar CSS base del proyecto (variables globales)
- Respetar patrones existentes: AlertDialog, sonner, apiClient, Tailwind layout
- El usuario depura todo al final — la IA solo deja código compilando

---

## PASO 1 — BUG CRÍTICO: SectionLabel no definido (PersonalPage.tsx)

**Error:** `Uncaught ReferenceError: SectionLabel is not defined` en PersonalPage.tsx:203 al editar miembro.

**Causa:** `SectionLabel` está definido en `PersonalForm.tsx:63` pero se usa en `PersonalPage.tsx` sin estar definido ni importado.

**Solución:** Agregar la función `SectionLabel` en PersonalPage.tsx (después de la función `inputStyle`, línea ~429):

```tsx
function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 12px" }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}
```

---

## PASO 2 — BUG: Validación Acceso al Sistema (PersonalPage.tsx)

**Problema:** `handleSubmit` (líneas 589-590, 608) SIEMPRE valida credenciales, aunque el acordeón esté cerrado.

**Solución:** Reemplazar líneas 589-590 y 608:

```tsx
// ANTES (incorrecto):
if (errs.usuario && !form.usuario.trim()) errs.usuario = "Usuario requerido";
if (!form.rolId) errs.rolId = "Rol del sistema requerido";

// DESPUÉS (correcto):
// SOLO validar credenciales si el acordeón está abierto
if (credOpen) {
  if (!form.usuario.trim()) errs.usuario = "Usuario requerido";
  if (!form.rolId) errs.rolId = "Rol del sistema requerido";
}
```

Y en `isMissingKeyFields` (línea 608), quitar la referencia a `rolId`:
```tsx
// ANTES:
(errs.usuario || !form.usuario.trim() || !form.rolId);

// DESPUÉS:
// (eliminar esta línea completa)
```

---

## PASO 3 — Separación Personal ↔ Configuración

### 3.1 Backend: PersonalService.cs

**Cambiar `ChangeEstadoAsync`** — solo modifica `personal.estado`:
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

**Agregar `ActualizarAccesoSistemaAsync`:**
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

### 3.2 Backend: Nuevo DTO `DTOs/Personal/AccesoSistemaUpdateDto.cs`
```csharp
public class AccesoSistemaUpdateDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public int RolId { get; set; }
}
```

### 3.3 Backend: Nuevo endpoint en PersonalController.cs
```csharp
[HttpPut("{id:guid}/acceso-sistema")]
public async Task<IActionResult> ActualizarAcceso(Guid id, [FromBody] AccesoSistemaUpdateDto dto, CancellationToken ct)
    => Respond(await _personalService.ActualizarAccesoSistemaAsync(id, dto.Username, dto.Password, dto.RolId, ct));
```

### 3.4 Frontend: PersonalPage.tsx DetailModal

**Quitar** botón "Desactivar" del DetailModal (líneas 393-401) — ahora se gestiona en Configuración.

**Mantener:** select de rol en formulario + acordeón acceso.

---

## PASO 4 — Catálogo Hospitales: Modal Extendido

### Problema
`cat_hospitales` tiene `direccion` y `telefono` en BD pero el CRUD genérico no los muestra.

### 4.1 Backend: ConfiguracionController.cs

Agregar al Dictionary `Catalogos` (línea 24-37):
```csharp
["hospitales"] = new("cat_hospitales", "hospital_id", "nombre", true),
```
Ya está registrado. El problema es que el CRUD genérico usa Dapper y solo maneja nombre + descripcion. Para hospitales se necesita un CRUD personalizado.

### 4.2 Frontend: SeguridadPage.tsx — Modal dinámico

Agregar constante para catálogos con campos extra:
```tsx
const CATALOGOS_COMPLEJOS: Record<string, { label: string; fields: { name: string; label: string; type: string; required?: boolean }[] }> = {
  "hospitales": {
    label: "Hospitales",
    fields: [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      { name: "direccion", label: "Dirección", type: "text" },
      { name: "telefono", label: "Teléfono", type: "text" },
      { name: "descripcion", label: "Descripción", type: "text" },
    ],
  },
};
```

Renderizado condicional del modal:
```tsx
{modalCatalogo && (
  CATALOGOS_COMPLEJOS[catalogoTipo] ? (
    <CatalogoModal
      fields={CATALOGOS_COMPLEJOS[catalogoTipo].fields}
      initial={editandoItem}
      onSave={guardarCatalogo}
      onClose={() => setModalCatalogo(false)}
    />
  ) : (
    <Modal width={420} onClose={() => setModalCatalogo(false)}>
      {/* Modal simple existente sin cambios */}
    </Modal>
  )}
}
```

### 4.3 Backend: Endpoint CRUD personalizado para hospitales

Agregar en ConfiguracionController.cs:
```csharp
[HttpPost("catalogos/hospitales-completo")]
public async Task<IActionResult> CrearHospitalCompleto([FromBody] HospitalCompletoDto dto)
{
    using var connection = AbrirConexion();
    var sql = @"INSERT INTO cat_hospitales (nombre, direccion, telefono) 
               VALUES (@Nombre, @Direccion, @Telefono) RETURNING hospital_id;";
    var id = await connection.ExecuteScalarAsync<int>(sql, new { dto.Nombre, dto.Direccion, dto.Telefono });
    return Ok(new { id, nombre = dto.Nombre });
}

[HttpPut("catalogos/hospitales-completo/{id:int}")]
public async Task<IActionResult> ActualizarHospitalCompleto(int id, [FromBody] HospitalCompletoDto dto)
{
    using var connection = AbrirConexion();
    var sql = @"UPDATE cat_hospitales SET nombre = @Nombre, direccion = @Direccion, telefono = @Telefono 
               WHERE hospital_id = @Id;";
    await connection.ExecuteAsync(sql, new { dto.Nombre, dto.Direccion, dto.Telefono, Id = id });
    return Ok(new { id, nombre = dto.Nombre });
}
```

### 4.4 Frontend: configuracionService.ts

Agregar:
```typescript
export const crearHospitalCompleto = (data: { nombre: string; direccion?: string; telefono?: string }) =>
  request(`${API_BASE_URL}/configuracion/catalogos/hospitales-completo`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  });

export const actualizarHospitalCompleto = (id: number, data: { nombre: string; direccion?: string; telefono?: string }) =>
  request(`${API_BASE_URL}/configuracion/catalogos/hospitales-completo/${id}`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  });
```

---

## PASO 5 — Catálogo Tipos de Asistencia (Emergencias)

### 5.1 BD: Crear tabla
```sql
CREATE TABLE cat_tipos_asistencia (
    tipo_asistencia_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO cat_tipos_asistencia (nombre) VALUES
('Maternidad'),
('Accidente de tránsito'),
('Accidente de trabajo'),
('Servicio Social'),
('Prevención'),
('Capacitación'),
('Otros');
```

### 5.2 Backend: ConfiguracionController.cs — Agregar al Dictionary
```csharp
["tipos-asistencia"] = new("cat_tipos_asistencia", "tipo_asistencia_id", "nombre", false),
```

### 5.3 Frontend: useEmergencias.ts
Agregar al estado de catalogos:
```typescript
tiposAsistencia: CatalogoItem[];
```
Cargar en `loadCatalogos()`:
```typescript
const tiposAsistencia = await getCatalogo("tipos-asistencia");
```

### 5.4 Frontend: RegisterServicePage.tsx — Input libre con autocomplete automático

Reemplazar sección 5 (líneas 469-532) con input que detecta coincidencias del catálogo automáticamente (funciona en móvil sin Enter):
```tsx
const [nuevoTipoAsistencia, setNuevoTipoAsistencia] = useState("");

<input
  list="tiposAsistenciaList"
  value={nuevoTipoAsistencia}
  onChange={(e) => {
    const valor = e.target.value;
    setNuevoTipoAsistencia(valor);
    const coincidencia = catalogos.tiposAsistencia.find(
      t => t.nombre.toLowerCase() === valor.toLowerCase()
    );
    if (coincidencia && !tiposAsistencia.includes(coincidencia.nombre)) {
      setTiposAsistencia([...tiposAsistencia, coincidencia.nombre]);
      setNuevoTipoAsistencia("");
      setErrors(prev => ({ ...prev, tiposAsistencia: false }));
    }
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter" && nuevoTipoAsistencia.trim()) {
      e.preventDefault();
      const valor = nuevoTipoAsistencia.trim();
      if (!tiposAsistencia.includes(valor)) {
        setTiposAsistencia([...tiposAsistencia, valor]);
      }
      setNuevoTipoAsistencia("");
      setErrors(prev => ({ ...prev, tiposAsistencia: false }));
    }
  }}
  placeholder="Escriba o seleccione..."
/>
<datalist id="tiposAsistenciaList">
  {catalogos.tiposAsistencia
    .filter(t => !tiposAsistencia.includes(t.nombre))
    .map(t => <option key={t.id} value={t.nombre} />)
  }
</datalist>
```

---

## PASO 6 — Búsqueda Typeahead (Personal)

### 6.1 BD: Índices
```sql
CREATE INDEX idx_personal_nombre ON personal (primer_apellido, primer_nombre);
CREATE INDEX idx_personal_dpi ON personal (dpi);
CREATE INDEX idx_personal_codigo ON personal (codigo_bombero);
```

### 6.2 Backend: PersonalService.cs — Agregar búsqueda
```csharp
public async Task<ServiceResult<List<PersonalResumenDto>>> BuscarAsync(string termino, CancellationToken ct = default)
{
    var search = $"%{termino}%";
    var sql = @"
        SELECT p.*, u.username, r.rol_id, r.nombre as rol_nombre
        FROM personal p
        LEFT JOIN usuarios u ON u.personal_id = p.personal_id
        LEFT JOIN usuario_roles ur ON ur.usuario_id = u.usuario_id
        LEFT JOIN roles r ON r.rol_id = ur.rol_id
        WHERE p.primer_nombre ILIKE @Search 
           OR p.segundo_nombre ILIKE @Search 
           OR p.primer_apellido ILIKE @Search 
           OR p.segundo_apellido ILIKE @Search 
           OR p.dpi ILIKE @Search 
           OR p.codigo_bombero ILIKE @Search
        ORDER BY p.primer_apellido, p.primer_nombre
        LIMIT 20";
    var registros = await connection.QueryAsync<PersonalResumenDto>(sql, new { Search = search });
    return ServiceResult<List<PersonalResumenDto>>.Success(registros.ToList());
}
```

### 6.3 Backend: PersonalController.cs
```csharp
[HttpGet("buscar")]
public async Task<IActionResult> Buscar([FromQuery] string q, CancellationToken ct)
    => Respond(await _personalService.BuscarAsync(q, ct));
```

### 6.4 Frontend: personalService.ts
```typescript
export const buscarPersonal = async (q: string): Promise<PersonalResponse[]> => {
  const res = await apiClient.get<BackendEnvelope<PersonalResponse[]>>(`/personal/buscar?q=${encodeURIComponent(q)}`);
  return res.data;
};
```

### 6.5 Frontend: PersonalPage.tsx — Typeahead con debounce
```tsx
const [suggestions, setSuggestions] = useState<PersonalResponse[]>([]);
const [showSuggestions, setShowSuggestions] = useState(false);

useEffect(() => {
  if (!search.trim()) {
    setSuggestions([]);
    setShowSuggestions(false);
    return;
  }
  const timer = setTimeout(async () => {
    try {
      const results = await buscarPersonal(search);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  }, 300);
  return () => clearTimeout(timer);
}, [search]);
```

Mostrar dropdown de sugerencias debajo del input de búsqueda.

---

## PASO 7 — Animaciones UI (PersonalPage.tsx)

### Stat Cards con hover
```tsx
// Agregar onMouseEnter onMouseLeave a las stat cards (líneas 805-834)
onMouseEnter={(e) => {
  e.currentTarget.style.transform = "scale(1.05)";
  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "scale(1)";
  e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
}}
onClick={() => setFilterEstado("Activo")} // o "Inactivo" según la card
```

### Dropdown estado personalizado (reemplazar select líneas 874-887)
Botón con punto de color + dropdown animado con opciones Activo/Inactivo/Todos.

---

## PASO 8 — Insumos en Emergencias → Inventario

### 8.1 Backend: EmergenciaService.cs — Agregar insumos al crear
En `CrearEmergenciaAsync`, después de insertar signos vitales y antes de commit:
```csharp
if (dto.InsumosUtilizados != null && dto.InsumosUtilizados.Any())
{
    foreach (var ins in dto.InsumosUtilizados)
    {
        var item = await connection.QueryFirstOrDefaultAsync<dynamic>(
            "SELECT item_id, nombre, stock_actual FROM inventario_items WHERE item_id = @ItemId",
            new { ins.ItemId }, transaction);
        if (item == null) throw new Exception($"Item {ins.ItemId} no existe");
        if ((int)item.stock_actual < ins.Cantidad) throw new Exception($"Stock insuficiente: {item.nombre}");

        await connection.ExecuteAsync(
            "UPDATE inventario_items SET stock_actual = stock_actual - @Cantidad WHERE item_id = @ItemId",
            new { ins.ItemId, ins.Cantidad }, transaction);

        var tipoMovId = await connection.QueryFirstOrDefaultAsync<int>(
            "SELECT tipo_mov_id FROM cat_tipos_movimiento WHERE codigo = 'USO_SERVICIO'",
            transaction: transaction);

        await connection.ExecuteAsync(
            @"INSERT INTO inventario_movimientos (item_id, tipo_mov_id, cantidad, motivo, responsable_id, fecha_hora)
              VALUES (@ItemId, @TipoMovId, @Cantidad, @Motivo, @ResponsableId, CURRENT_TIMESTAMP)",
            new { ins.ItemId, TipoMovId = tipoMovId, ins.Cantidad, Motivo = $"Uso en servicio {numeroIncidente}", ResponsableId = (object?)dto.FormuladoPorId ?? DBNull.Value }, transaction);

        await connection.ExecuteAsync(
            "INSERT INTO servicio_insumos_utilizados (servicio_id, item_id, cantidad) VALUES (@ServicioId, @ItemId, @Cantidad)",
            new { ServicioId = servicioId, ins.ItemId, ins.Cantidad }, transaction);
    }
}
```

### 8.2 Backend: DTO — Agregar insumos a EmergenciaCreateDto
```csharp
public class InsumoEmergenciaDto
{
    public int ItemId { get; set; }
    public int Cantidad { get; set; }
}

// En EmergenciaCreateDto, agregar:
public List<InsumoEmergenciaDto> InsumosUtilizados { get; set; } = new();
```

### 8.3 Frontend: ServicioInsumosPage.tsx → Solo lectura
Eliminar modal crear/editar, botón "Registrar Uso". Mantener tabla con filtros + badge "Solo lectura".

---

## ORDEN DE EJECUCIÓN

1. PASO 1: SectionLabel (fix inmediato)
2. PASO 2: Validación acceso al sistema (fix)
3. PASO 3: Separación Personal ↔ Configuración
4. PASO 4: Hospitales modal extendido
5. PASO 5: Catálogo tipos asistencia + input autocomplete
6. PASO 6: Búsqueda typeahead
7. PASO 7: Animaciones UI
8. PASO 8: Insumos en Emergencias

---

## VERIFICACIÓN FINAL (la IA ejecuta, el usuario depura)

```bash
# Backend
cd Backend_Sub33/Backend_Sub33
dotnet build                    # 0 errores

# Frontend
npm run build                   # 0 errores TypeScript
```

Tests manuales (el usuario verifica en runtime):
- [ ] Editar miembro sin error SectionLabel
- [ ] Registrar miembro sin acceso al sistema (acordeón cerrado)
- [ ] Registrar miembro CON acceso al sistema (acordeón abierto)
- [ ] Desactivar bombero en Personal ≠ desactivar cuenta en Configuración
- [ ] Crear hospital con dirección y teléfono desde Configuración
- [ ] Buscar typeahead en Personal (300ms debounce)
- [ ] Stat cards con animación hover
- [ ] Tipos de asistencia: input libre con autocomplete (móvil)
- [ ] Crear emergencia con insumos → stock descuenta
- [ ] ServicioInsumosPage solo lectura, sin botón crear

---

**ENTREGABLE:** Código compilando, tests pasando, terminal libre, funcionalidad actual intacta. El usuario depura manualmente al final.
