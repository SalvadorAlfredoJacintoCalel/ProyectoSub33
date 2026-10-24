# PLAN DE MEJORAS - ProyectoSub33

## 📁 UBICACIONES EXACTAS (NO buscar, usar estas rutas)

| Área | Archivos |
|------|----------|
| **Backend Services** | `Backend_Sub33/Backend_Sub33/Services/PersonalService.cs`, `InventarioService.cs`, `DonacionService.cs`, `EmergenciaService.cs` |
| **Backend Controllers** | `Backend_Sub33/Backend_Sub33/Controllers/PersonalController.cs`, `ConfiguracionController.cs`, `InventarioController.cs` |
| **Backend DTOs** | `Backend_Sub33/Backend_Sub33/DTOs/Personal/PersonalDtos.cs`, `DTOs/Inventario/InventarioDtos.cs` |
| **Frontend Pages** | `src/app/pages/Personal/PersonalPage.tsx`, `src/app/pages/Personal/components/PersonalTable.tsx`, `src/app/pages/Seguridad/SeguridadPage.tsx` |
| **Frontend Hooks** | `src/hooks/useInventario.ts`, `src/hooks/useEmergencias.ts` |
| **Frontend Services** | `src/services/personalService.ts`, `src/services/inventarioService.ts`, `src/services/api/client.ts` |
| **Frontend Types** | `src/types/personal.ts`, `src/types/inventario.ts`, `src/types/emergencia.ts` |
| **DB Context** | `Backend_Sub33/Backend_Sub33/Data/AppDbContext.cs` |

---

## REGLAS NO NEGOCIABLES

- **NO romper** funcionalidad actual ni diseños CSS (variables `var(--red)`, `var(--bg-input)`)
- **NO dejar** `dotnet run`, `dotnet watch`, `npm run dev`, `vite` corriendo al final
- **NO usar** `any` — TypeScript strict
- **NO fetch directo** — solo `apiClient` de `src/services/api/client.ts`
- **NO hardcodear URLs** — `import.meta.env.VITE_API_BASE_URL`
- **NO eliminar código funcional** — solo extender/optimizar
- **Ejecutar migración con** `CREATE INDEX CONCURRENTLY` (no bloquea BD)

---

## TAREAS (ejecutar en orden)

### TAREA 1 — Índices BD (Prioridad CRÍTICA)
**Archivo:** `Backend_Sub33/Backend_Sub33/Migrations/` (nueva migración)

```sql
-- Ejecutar en PostgreSQL via pgAdmin o dotnet ef migrations add AddSearchIndexes
CREATE INDEX CONCURRENTLY idx_personal_dpi ON personal (dpi);
CREATE INDEX CONCURRENTLY idx_personal_codigo_bombero ON personal (codigo_bombero);
CREATE INDEX CONCURRENTLY idx_personal_nombre ON personal (primer_apellido, primer_nombre);
CREATE INDEX CONCURRENTLY idx_usuarios_username ON usuarios (username);
CREATE INDEX CONCURRENTLY idx_inventario_codigo ON inventario_items (codigo_barras);
CREATE INDEX CONCURRENTLY idx_inventario_nombre ON inventario_items (nombre);
CREATE INDEX CONCURRENTLY idx_movimientos_item ON inventario_movimientos (item_id, fecha_hora);
```

**Verificación:** `EXPLAIN ANALYZE SELECT * FROM personal WHERE dpi = '1234567890123';` → debe mostrar "Index Scan"

---

### TAREA 2 — Fix N+1 Query en PersonalService.GetResumenAsync
**Archivo:** `Backend_Sub33/Backend_Sub33/Services/PersonalService.cs`

En `GetResumenAsync` (línea ~49-80), reemplazar N+1 por batch:

```csharp
// ANTES: RolNombre = rolesPorPersonal.GetValueOrDefault(p.PersonalId)
// DESPUÉS: mantener ya que ObtenerRolesPorPersonalAsync es batch (línea 646-654)
// VERIFICAR que rolesPorPersonal se carga UNA sola vez fuera del Select
var rolesPorPersonal = await ObtenerRolesPorPersonalAsync(ids, ct); // batch OK
```

En `BuscarAsync` (línea ~133-187), AGREGAR batch:

```csharp
var ids = registros.Select(p => p.PersonalId).ToList();
var usuariosPorPersonal = await ObtenerUsuariosPorPersonalAsync(ids, ct);
var rolesPorPersonal = await ObtenerRolesPorPersonalAsync(ids, ct);
// Luego en Select: TieneUsuario = usuariosPorPersonal.ContainsKey(p.PersonalId),
// Usuario = usuariosPorPersonal.GetValueOrDefault(p.PersonalId)
// RolNombre = rolesPorPersonal.GetValueOrDefault(p.PersonalId)
```

---

### TAREA 3 — Bloqueo Optimista en Entities
**Archivos:** `Backend_Sub33/Backend_Sub33/Models/Personal.cs`, `Models/Usuario.cs`, `Models/Entities/InventarioItem.cs`

Agregar a cada entidad:
```csharp
[ConcurrencyCheck]
public byte[] RowVersion { get; set; } = Guid.NewGuid().ToByteArray();
```

En `AppDbContext.cs` OnModelCreating:
```csharp
modelBuilder.Entity<Personal>().Property(p => p.RowVersion).IsRowVersion();
modelBuilder.Entity<InventarioItem>().Property(i => i.RowVersion).IsRowVersion();
```

Migración:
```bash
cd Backend_Sub33/Backend_Sub33
dotnet ef migrations add AddRowVersionConcurrency
dotnet ef database update
```

---

### TAREA 4 — Fix Race Condition en Crear Usuario
**Archivo:** `Backend_Sub33/Backend_Sub33/Services/PersonalService.cs`

En `CreateAsync` (línea 136), reemplazar check+insert no atómico por upsert:

```csharp
using var transaction = await _context.Database.BeginTransactionAsync(ct);
try {
    // Insert directamente con catch de unique violation
    var personal = new Personal { ... };
    _context.Personal.Add(personal);
    await _context.SaveChangesAsync(ct); // Si DPI dup → DbUpdateException

    if (username is not null) {
        var usuario = new Usuario { ... };
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync(ct); // Si username dup → DbUpdateException
        _context.UsuarioRoles.Add(new UsuarioRol { ... });
        await _context.SaveChangesAsync(ct);
    }
    await transaction.CommitAsync(ct);
}
catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("dpi") == true) {
    await transaction.RollbackAsync(ct);
    return ServiceResult<PersonalResponseDto>.Conflict("El DPI ya se encuentra registrado.");
}
catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("username") == true) {
    await transaction.RollbackAsync(ct);
    return ServiceResult<PersonalResponseDto>.Conflict("El nombre de usuario ya existe.");
}
```

---

### TAREA 5 — Debounce en Búsqueda (Frontend)
**Archivo:** `src/app/pages/Personal/PersonalPage.tsx` (línea ~457)

Reemplazar input búsqueda:
```tsx
const [searchInput, setSearchInput] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");

useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 250);
    return () => clearTimeout(timer);
}, [searchInput]);
// Usar debouncedSearch en useMemo filter en lugar de search
```

**Archivo:** `src/app/pages/Inventario/InventarioPage.tsx` (línea ~63)

Aplicar mismo patrón de debounce.

---

### TAREA 6 — React.memo en Filas de Tabla
**Archivos:** `src/app/pages/Personal/components/PersonalTable.tsx`, `src/app/pages/Inventario/components/InventarioTable.tsx`

```tsx
const MemoizedRow = React.memo(({ m, onView, onEdit, onDelete }: RowProps) => (<tr>...</tr>));

// En tabla: {pageRows.map((m) => <MemoizedRow key={m.personalId} m={m} onView={onView} />)}
```

---

### TAREA 7 — Deduplicación de Peticiones (Frontend)
**Archivo:** `src/services/api/client.ts`

Agregar cache simple:
```typescript
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30000; // 30s

export function createApiClient(config?) {
    // ... existente ...
    async function request<T>(path: string, options = {}): Promise<T> {
        const cacheKey = `${options.method || "GET"}:${path}`;
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL && options.method === undefined) {
            return cached.data as T;
        }
        const response = await fetch(url, { ...fetchOptions, headers: mergedHeaders });
        // ... parseo ...
        cache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    }
}
```

---

### TAREA 8 — Sincronización Configuración ↔ Personal (VERIFICAR)
**Archivos:** `src/app/pages/Seguridad/SeguridadPage.tsx` (líneas 467-539), `src/app/pages/Personal/PersonalPage.tsx` (línea 557-570)

Verificar que `window.dispatchEvent(new CustomEvent("usuarios-actualizados"))` se llama en:
- `handleEstado` ✅ (ya agregado)
- `handleRol` ✅ (ya agregado)
- `handleCambiarUsername` ✅ (ya agregado)
- `handleCambiarPassword` ✅ (ya agregado)

Verificar que PersonalPage escucha:
```typescript
useEffect(() => {
    const handler = () => fetchPersonal();
    window.addEventListener("usuarios-actualizados", handler);
    return () => window.removeEventListener("usuarios-actualizados", handler);
}, [fetchPersonal]);
```

---

## VERIFICACIÓN FINAL (la IA ejecuta, usuario depura)

```bash
# Backend
cd Backend_Sub33/Backend_Sub33
dotnet build                    # 0 errores

# Frontend
npm run build                   # 0 errores TypeScript

# BD
psql -d Sub_33 -c "EXPLAIN ANALYZE SELECT * FROM personal WHERE dpi = '1234567890123';"
# Debe mostrar: Index Scan using idx_personal_dpi
```

**Tests manuales (usuario verifica en runtime):**
- [ ] Búsqueda Personal: escribir rápido → sin lag (debounce)
- [ ] Cambiar rol en Configuración → ir a Personal → recarga automática
- [ ] Crear personal con DPI duplicado → error 409 claro (no 500)
- [ ] Editar personal → funciona sin conflictos
- [ ] Inventario búsqueda → resultados instantáneos
- [ ] `dotnet build` ✅ `npm run build` ✅
- [ ] Terminal libre (sin procesos corriendo)

---

**ENTREGABLE:** Código compilando, índices activos, N+1 corregido, debounce funcionando, sincronización verificada, terminal libre.
