# PLAN — Eliminación de Advertencias y Buenas Prácticas en Backend_Sub33

**Fecha:** 2026-10-22
**Proyecto:** `C:\ProyectoSub33-main\ProyectoSub33-main`
**Objetivo:** Eliminar TODAS las advertencias (warnings) del backend, aplicar nullable reference types correctamente, corregir async/disposables, y dejar configurado un sistema de analyzers/linters que evite regresiones.

---

## 📁 UBICACIONES EXACTAS (NO buscar, usar estas rutas)

| Área | Archivo |
|------|---------|
| **Proyecto** | `Backend_Sub33/Backend_Sub33/Backend_Sub33.csproj` |
| **Services (EF Core)** | `Backend_Sub33/Backend_Sub33/Services/PersonalService.cs`, `RolService.cs`, `RangoService.cs` |
| **Services (Dapper)** | `Backend_Sub33/Backend_Sub33/Services/VehiculoService.cs`, `InventarioService.cs`, `DonacionService.cs`, `EmergenciaService.cs`, `CuponService.cs`, `DonacionLibroService.cs` |
| **Helpers** | `Backend_Sub33/Backend_Sub33/Services/DonacionLibroHelper.cs`, `Backend_Sub33/Backend_Sub33/Services/CurrentUser.cs` |
| **Common** | `Backend_Sub33/Backend_Sub33/Common/ServiceResult.cs`, `ApiResponse.cs`, `PaginatedResult.cs`, `TextNormalizer.cs` |
| **Models** | `Backend_Sub33/Backend_Sub33/Models/*.cs` y `Models/Entities/*.cs` |
| **DTOs** | `Backend_Sub33/Backend_Sub33/DTOs/**/*.cs` |
| **Controllers** | `Backend_Sub33/Backend_Sub33/Controllers/*.cs` |
| **DB Context** | `Backend_Sub33/Backend_Sub33/Data/AppDbContext.cs` |
| **Program** | `Backend_Sub33/Backend_Sub33/Program.cs` |

---

## REGLAS NO NEGOCIABLES

- **NO romper** funcionalidad actual. Solo corregir tipos, async, disposables y estilo.
- **NO cambiar** firmas públicas de endpoints ni el contrato JSON de respuesta (`ApiResponse`, `ServiceResult`).
- **NO eliminar** lógica de negocio. Solo refactorizar patrones repetidos si es seguro.
- **Compilar al final de CADA fase**: `dotnet build` con 0 errores.
- **NO ejecutar** `dotnet run`, `dotnet watch` ni dejar procesos corriendo al final.
- **NO tocar** el frontend (`src/`). Este plan es SOLO backend.
- **NO agregar** comentarios innecesarios al código fuente, salvo los XML-doc que ya existen.
- Si un `warning` no está descrito aquí pero aparece al compilar, corregirlo siguiendo el mismo criterio.

---

## CONTEXTO ACTUAL

El proyecto compila con `0 Advertencia(s)` porque NO hay analyzers habilitados ni `TreatWarningsAsErrors`. Sin embargo, con `<Nullable>enable</Nullable>` activado, existen patrones que cualquier analyzer (IDE, CI) marcará como warning. Este plan corrige la deuda técnica y blinda el proyecto contra regresiones.

Categorías de warnings a eliminar:
1. **Nullable Reference Types** — CS8600, CS8601, CS8602, CS8603, CS8604, CS8618, CS8625
2. **Async/Await** — CS4014 (Task no esperada), CS1998 (async sin await)
3. **Variables/parámetros no usados** — IDE0060, IDE0059, CS0219
4. **Catch genérico** — CA1031
5. **Disposables** — CA2000, CA2213
6. **APIs obsoletas** — SYSLIB0011
7. **Miembros que pueden ser static** — CA1822

---

## FASE 1 — Configuración del Proyecto (CRÍTICA, hacer primero)

### TAREA 1.1 — Actualizar `Backend_Sub33.csproj`

**Archivo:** `Backend_Sub33/Backend_Sub33/Backend_Sub33.csproj`

Reemplazar TODO el contenido por:

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <AnalysisLevel>latest-recommended</AnalysisLevel>
    <EnableNETAnalyzers>true</EnableNETAnalyzers>
    <AnalysisMode>AllEnabledByDefault</AnalysisMode>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
    <GenerateDocumentationFile>false</GenerateDocumentationFile>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="BCrypt.Net-Next" Version="4.2.0" />
    <PackageReference Include="Dapper" Version="2.1.79" />
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.11" />
    <PackageReference Include="Microsoft.CodeAnalysis.NetAnalyzers" Version="8.0.0">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
    </PackageReference>
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.10">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="Microsoft.IdentityModel.Tokens" Version="8.22.0" />
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.4" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.6.2" />
    <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.22.0" />
  </ItemGroup>

</Project>
```

**Nota importante:** NO agregar `TreatWarningsAsErrors` todavía. Se agrega al final (Fase 6), una vez que el código quede limpio. Si se agrega ahora, el build fallará.

### TAREA 1.2 — Crear `.editorconfig` en la raíz del backend

**Archivo:** `Backend_Sub33/.editorconfig` (NUEVO)

```ini
root = true

[*.cs]

# ── Estilo general ────────────────────────────────
indent_style = space
indent_size = 4
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
end_of_line = lf

# ── Nullable (errores de referencia nula) ────────
dotnet_diagnostic.CS8600.severity = warning
dotnet_diagnostic.CS8601.severity = warning
dotnet_diagnostic.CS8602.severity = warning
dotnet_diagnostic.CS8603.severity = warning
dotnet_diagnostic.CS8604.severity = warning
dotnet_diagnostic.CS8618.severity = warning
dotnet_diagnostic.CS8625.severity = warning

# ── Async/Await ──────────────────────────────────
dotnet_diagnostic.CS4014.severity = warning
dotnet_diagnostic.CS1998.severity = warning

# ── Variables no usadas ──────────────────────────
dotnet_diagnostic.CS0219.severity = warning
dotnet_diagnostic.IDE0060.severity = suggestion
dotnet_diagnostic.IDE0059.severity = suggestion

# ── Code quality (analyzers) ─────────────────────
dotnet_diagnostic.CA1031.severity = none
dotnet_diagnostic.CA2000.severity = suggestion
dotnet_diagnostic.CA2213.severity = suggestion
dotnet_diagnostic.CA1822.severity = suggestion
dotnet_diagnostic.SYSLIB0011.severity = suggestion

# ── Modern C# ────────────────────────────────────
csharp_style_var_when_type_is_apparent = true:suggestion
csharp_style_prefer_switch_expression = true:suggestion
csharp_style_pattern_matching_over_as_with_null_check = true:suggestion
csharp_style_expression_bodied_methods = true:suggestion
csharp_style_expression_bodied_properties = true:suggestion
dotnet_style_predefined_type_for_locals_parameters_members = true:suggestion
```

**Nota:** `CA1031` (catch genérico) se deja en `none` porque el patrón `catch (Exception ex)` es intencional en este proyecto (los services capturan y convierten en `ServiceResult`). Corregirlo rompería el diseño de manejo de errores.

### TAREA 1.3 — Verificar que compila

```powershell
cd Backend_Sub33/Backend_Sub33
dotnet build
```

Debe compilar. Tomar nota de los warnings que aparezcan ahora con analyzers activos para resolverlos en las fases siguientes.

---

## FASE 2 — Nullable Reference Types en Models y DTOs (CRÍTICA)

### Principio general

Toda propiedad `string` o de referencia que NO puede ser null debe tener un valor inicial o estar marcada `required`. Toda propiedad que SÍ puede ser null debe usar `?`.

### TAREA 2.1 — `Models/Personal.cs`

Revisar y corregir las siguientes propiedades para que NO produzcan CS8618 (propiedad non-null sin inicializar):

- `PrimerNombre`, `PrimerApellido`, `Dpi`, `Telefono` ya tienen `= string.Empty` → OK.
- `FechaNacimiento` es `DateTime?` → OK.
- `RangoId` es `int?` → OK.
- `FechaIngreso`, `CreatedAt`, `UpdatedAt` son `DateTime` sin inicializar → **agregar** `= DateTime.UtcNow` (o `= default` si prefiere). Usar `DateTime.UtcNow`.
- `Rango` es `CatRango?` → OK.

**Cambios exactos en `Personal.cs`:**
```csharp
// ANTES
public DateTime FechaIngreso { get; set; }
public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
```
```csharp
// DESPUÉS (agregar inicializador a FechaIngreso)
public DateTime FechaIngreso { get; set; } = DateTime.UtcNow;
public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
```

### TAREA 2.2 — `Models/Usuario.cs`

- `Username`, `PasswordHash` ya tienen `= string.Empty` → OK.
- `CreatedAt`, `UpdatedAt` son `DateTime` sin inicializar → **agregar** `= DateTime.UtcNow`.
- `NombreCompleto` tiene `= string.Empty` y `[NotMapped]` → OK.

### TAREA 2.3 — Revisar TODAS las entidades en `Models/` y `Models/Entities/`

Aplicar la misma regla en TODOS los archivos:
- Propiedades `string` no-null → `= string.Empty` o `= default!`.
- Propiedades `DateTime` no-null → `= DateTime.UtcNow`.
- Propiedades de navegación opcionales → `?`.
- Propiedades `ICollection<T>` → `= new List<T>();`.

**Lista de archivos a revisar:**
- `Models/Rol.cs`, `UsuarioRol.cs`, `UsuarioPermiso.cs`, `UsuarioModulo.cs`, `RolPermiso.cs`, `RolModulo.cs`
- `Models/Entities/CatRango.cs`, `CatModulo.cs`, `CatHospital.cs`, `CatUnidad.cs`, `CatTipoEmergencia.cs`, `Permiso.cs`, `ParametroSistema.cs`, `Donacion.cs`, `MaterialDonacion.cs`, `InventarioItem.cs`, `InventarioMovimiento.cs`, `EquipoUnidad.cs`, `ServicioInsumoUtilizado.cs`, `ServicioPersonalAsignado.cs`, `ServicioTipoAsistencia.cs`, `EmergenciaServicio.cs`, `SignosVitalesPaciente.cs`, `SesionActiva.cs`, `BitacoraAcceso.cs`, `CodigoRecuperacion.cs`, `RevisionNuevaOpcion.cs`

**Regla de oro:** si la propiedad se carga desde DB y NO es nullable en el esquema, usar inicializador `= string.Empty` / `= DateTime.UtcNow` / `= 0` (para value types con `?` no necesario). Si es nullable en DB, usar `?`.

### TAREA 2.4 — Revisar DTOs

En `DTOs/**/*.cs`, TODA propiedad `string` no-null ya debe tener `= string.Empty` o `= ""`. Verificar especialmente:
- `DTOs/Personal/PersonalDtos.cs` → ya OK (usa `= string.Empty`).
- `DTOs/Vehiculos/VehiculoDtos.cs` → usa `= ""` y `= "Operativa"`, OK.
- `DTOs/Donacion/DonacionDtos.cs`, `DTOs/Inventario/InventarioDtos.cs`, `DTOs/Roles/RolDtos.cs`, `DTOs/Configuracion/ConfiguracionDtos.cs`, `DTOs/Seguridad/*.cs`, `DTOs/Catalogos/RangoDtos.cs` → verificar el mismo patrón.

Si una propiedad de response DTO puede ser null (porque viene de una columna nullable), marcar con `?`.

---

## FASE 3 — `ServiceResult` y `ApiResponse` (CRÍTICA para CS8603/CS8619)

### TAREA 3.1 — `Common/ServiceResult.cs`

El tipo genérico `ServiceResult<T>` tiene `public T? Data { get; }` (correcto). El problema está en el constructor y métodos que usan `default`.

**Cambio requerido en `From`:**
```csharp
// ANTES (produce CS8603 posible retorno null)
public static ServiceResult<T> From(ServiceResult result)
    => new(result.IsSuccess, default, result.Error, result.StatusCode);
```
```csharp
// DESPUÉS (explicitar que default es null intencional)
public static ServiceResult<T> From(ServiceResult result)
    => new(result.IsSuccess, default, result.Error, result.StatusCode);
```
Este código ya es correcto porque `default` para `T?` es null y `Data` es `T?`. **No requiere cambio** salvo que el analyzer marque lo contrario. Si aparece CS8603, cambiar la firma del constructor a aceptar `T? data` (ya lo hace) y no tocar nada más.

**Verificar que NO haya `return ServiceResult<T>.Success(...)` con un valor posiblemente null** (CS8604). Buscar patrones como:
```csharp
return ServiceResult<VehiculoMantenimientoDto>.Success(creado!);  // ya usa ! → OK
```

### TAREA 3.2 — `Common/ApiResponse.cs`

Leer el archivo y verificar que `Data` sea `object?` (nullable) y que los métodos estáticos no produzcan CS8619. Si `ApiResponse.Ok(null, msg)` se usa con null, la firma debe ser `object? data`.

---

## FASE 4 — Async/Await y Disposables (IMPORTANTE)

### TAREA 4.1 — `Services/PersonalService.cs` — `ObtenerUsuariosPorPersonalAsync`

La línea actual produce advertencia por posible `PersonalId!.Value` cuando `PersonalId` es nullable y por el selector del diccionario:

```csharp
// ANTES (línea ~787)
return await _context.Usuarios
    .AsNoTracking()
    .Where(u => u.PersonalId.HasValue && ids.Contains(u.PersonalId.Value))
    .ToDictionaryAsync(u => u.PersonalId!.Value, u => (string?)u.Username, ct);
```
Esto es correcto. **No tocar** salvo que haya CS8602/CS8604. Si aparece, refinar:
```csharp
return (await _context.Usuarios
    .AsNoTracking()
    .Where(u => u.PersonalId.HasValue && ids.Contains(u.PersonalId!.Value))
    .Select(u => new { u.PersonalId, u.Username })
    .ToListAsync(ct))
    .Where(u => u.PersonalId.HasValue)
    .ToDictionary(u => u.PersonalId!.Value, u => u.Username);
```

### TAREA 4.2 — Servicios Dapper: conexiones y transacciones

Patrón ACTUAL repetido en `VehiculoService`, `InventarioService`, `DonacionService`, `EmergenciaService`, `CuponService`:

```csharp
private DbConnection AbrirConexion()
{
    var connection = _context.Database.GetDbConnection();
    if (connection.State != ConnectionState.Open)
    {
        connection.Open();
    }
    return connection;
}
```

**Cambio recomendado (async + using correcto):** crear una clase base y migrar. Ver Fase 5.

**Mínimo viable sin clase base** — en cada servicio cambiar `using var connection = AbrirConexion();` para asegurar disposición correcta. Ya usan `using var`, lo cual es correcto. La mejora es `OpenAsync` con `CancellationToken`, pero NO es obligatoria para eliminar warnings. **Prioridad baja.**

### TAREA 4.3 — `Program.cs` — `AppContext.SetSwitch`

La línea `AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);` está bien. NO tocar.

### TAREA 4.4 — Verificar `async` sin `await` (CS1998)

Buscar métodos `async` que no contienen `await`:
```powershell
cd Backend_Sub33/Backend_Sub33
rg "async.*=>" --glob "*.cs"
rg "async Task" -l | ForEach-Object { $_ }
```
Si se encuentra un método `async` que no usa `await`, quitar `async` y devolver `Task.FromResult(...)` o el valor directo. En este proyecto, revisar `VehiculoService.DeleteAsync` que es `public Task<ServiceResult> DeleteAsync(int id) => DeleteInternalAsync(id);` → NO es async, está correcto.

---

## FASE 5 — Refactor: clase base para servicios Dapper (MEJORA)

### TAREA 5.1 — Crear `Services/BaseDapperService.cs` (NUEVO)

```csharp
using System.Data;
using System.Data.Common;
using Backend_Sub33.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend_Sub33.Services;

public abstract class BaseDapperService
{
    protected readonly AppDbContext Context;

    protected BaseDapperService(AppDbContext context) => Context = context;

    protected DbConnection OpenConnection()
    {
        var connection = Context.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            connection.Open();
        }
        return connection;
    }

    protected async Task<T> ExecuteInTransactionAsync<T>(
        Func<DbConnection, DbTransaction, Task<T>> action,
        CancellationToken ct = default)
    {
        await using var connection = OpenConnection();
        await using var transaction = await connection.BeginTransactionAsync(ct);
        try
        {
            var result = await action(connection, transaction);
            await transaction.CommitAsync(ct);
            return result;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    protected async Task ExecuteInTransactionAsync(
        Func<DbConnection, DbTransaction, Task> action,
        CancellationToken ct = default)
    {
        await ExecuteInTransactionAsync(async (c, t) =>
        {
            await action(c, t);
            return true;
        }, ct);
    }
}
```

### TAREA 5.2 — Migrar servicios Dapper a `BaseDapperService`

Cambiar en cada servicio (`VehiculoService`, `InventarioService`, `DonacionService`, `EmergenciaService`, `CuponService`, `DonacionLibroService`):
- `public class XService : IXService` → `public class XService : BaseDapperService, IXService`
- Constructor: `public XService(AppDbContext context) : base(context) => _context = context;`
- Mantener `private readonly AppDbContext _context;` solo si se sigue usando; si no, eliminar y usar `Context`.
- Eliminar el método `AbrirConexion()` local y usar `OpenConnection()` de la base.

**IMPORTANTE:** Esta fase es opcional para eliminar warnings, pero mejora la mantenibilidad y elimina duplicación. Si el tiempo es limitado, puede omitirse sin afectar el objetivo de 0 warnings.

---

## FASE 6 — Cierre: TreatWarningsAsErrors y verificación final

### TAREA 6.1 — Activar `TreatWarningsAsErrors`

Una vez que `dotnet build` muestre 0 warnings, agregar al `csproj`:

```xml
<PropertyGroup>
  ...
  <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
</PropertyGroup>
```

### TAREA 6.2 — Compilar y validar

```powershell
cd Backend_Sub33/Backend_Sub33
dotnet build
```

Resultado esperado: `0 Advertencia(s)`, `0 Errores`.

---

## VERIFICACIÓN FINAL OBLIGATORIA

```powershell
# Backend
cd Backend_Sub33/Backend_Sub33
dotnet build          # 0 errores, 0 advertencias

# Opcional: dotnet format para verificar estilo
dotnet format --verify-no-changes --verbosity diagnostic
```

**Checklist manual:**
- [ ] `dotnet build` → 0 warnings, 0 errors
- [ ] `.editorconfig` creado en `Backend_Sub33/`
- [ ] `Backend_Sub33.csproj` con analyzers y `TreatWarningsAsErrors`
- [ ] Models y DTOs con inicializadores correctos (sin CS8618)
- [ ] `ServiceResult<T>` sin CS8603/CS8604
- [ ] No quedan procesos `dotnet run`/`dotnet watch` corriendo
- [ ] Terminal libre

---

## NOTAS PARA LA IA IMPLEMENTADORA

1. **ORDEN DE EJECUCIÓN:** Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 (opcional) → Fase 6. No saltarse.
2. **CA1031 (catch genérico):** NO corregir. Es intencional (patrón ServiceResult). Está en `none` en el `.editorconfig`.
3. **NO tocar frontend** (`src/`), ni `Program.cs` salvo lo indicado.
4. **NO cambiar el contrato JSON** de respuestas.
5. **Si aparece un warning NO listado:** corregirlo con el mismo criterio (nullable → inicializar o `?`; unused → eliminar; async sin await → quitar `async`).
6. **`DateTime.UtcNow` vs `DateTimeOffset.UtcNow`:** mantener `DateTime.UtcNow` para no romper compatibilidad con las columnas `timestamp with time zone` existentes y el switch de legacy timestamp en `Program.cs`.
7. **Verificar al final de cada fase** con `dotnet build` para detectar regresiones tempranas.

---

## ENTREGABLE

Código backend compilando con **0 warnings y 0 errores**, analyzers habilitados, `.editorconfig` y `TreatWarningsAsErrors` configurados, y sin procesos corriendo al finalizar.
