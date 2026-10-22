# Prompt para IA - Aplicar Mejoras de Advertencias Backend_Sub33

## Contexto
Proyecto: **Backend_Sub33** (ASP.NET Core 8.0, PostgreSQL, Dapper, EF Core)
- Build actual: **0 warnings, 0 errores**
- Advertencias visibles: **Sugerencias de IDE** (squiggles) por reglas en `.editorconfig` con severidad `suggestion`
- Archivos clave: `Controllers/CuponesController.cs`, `DTOs/Vehiculos/VehiculoDtos.cs`, `Services/*.cs`, `Backend_Sub33.csproj`

---

## Tu Misión
Aplicar las 6 fases del plan para eliminar **todas las sugerencias de IDE** sin alterar funcionalidad. El build debe seguir pasando (0 warnings/errors).

---

## FASE 1: DTOs - Nullability & Inicialización (OBLIGATORIO)

### Archivo: `DTOs/Vehiculos/VehiculoDtos.cs`

**Cambios requeridos:**

1. **Propiedades `string` non-nullable** → Usar `required` (C# 11) o inicializar con `= ""`
   - `VehiculoDto`: `Marca`, `Modelo`, `EstadoOperativo`, `Origen`, `Estado`, `Combustible`, `CondicionLlantas`, `VolanteDireccion`, `NoUnidad`, `Motor`, `Chasis`, `Placa`, `Color`, `Ubicacion`, `Donante`, `NoReciboDonacion`
   - `VehiculoCreateDto` / `VehiculoUpdateDto`: `Marca`, `Modelo`, `EstadoOperativo`, `Origen`, `Estado`, `Combustible`, `CondicionLlantas`, `VolanteDireccion`, `NoUnidad`, `Motor`, `Chasis`, `Placa`, `Color`, `Ubicacion`, `Donante`, `DpiNit`, `Telefono`, `NoReciboDonacion`, `Responsable`
   - `VehiculoMantenimientoDto` / `Create`: `Tipo`, `Estado`, `CombustibleEntrada`, `CombustibleSalida`, `PedalesClutch`, `PedalesFrenos`, `PedalesAcelerador`, `AceiteMotor`, `EstadoBateria`, `NivelRefrigerante`, `SistemaDireccion`, `TorretaLuces`, `SirenaBocina`, `EspejoIzquierdo`, `EspejoDerecho`, `CalaveraIzquierda`, `CalaveraDerecha`, `FaroIzquierdo`, `FaroDerecho`, `Recomendaciones`, `PilotoPermanente`, `PilotoVoluntario`, `Escuadra`, `HorarioTurno`, `JefeServicio`, `FirmaPiloto`, `FirmaJefeServicio`
   - `CuponPeriodoDto`: `Notas`, `ElaboradoPor`, `JefeAbastecimientos`, `Jefe33Cia`, `Director`, `FirmaElaboradoPorBase64`, `FirmaJefeAbastecimientosBase64`, `FirmaJefe33CiaBase64`, `FirmaDirectorBase64`
   - `CuponPeriodoCreateDto`: `Notas`, `ElaboradoPor`, `JefeAbastecimientos`, `Jefe33Cia`, `Director`, `FirmaElaboradoPorBase64`, `FirmaJefeAbastecimientosBase64`, `FirmaJefe33CiaBase64`, `FirmaDirectorBase64`
   - `VehiculoCuponDto`: `Responsable`, `GasolineraNombre`, `Observaciones`, `FirmaBase64`
   - `CuponCreateDto` / `CuponUpdateDto`: `Responsable`, `FirmaBase64`, `Observaciones`
   - `ReporteEncabezadoDto`: `MesNombre`
   - `FirmaReporteDto`: `Nombre`
   - `ReporteFirmasDto`: propiedades `FirmaReporteDto` ya inicializadas con `= new()` ✅

2. **Colecciones** → Inicializar con `= new()`
   - `VehiculoDto.Mantenimientos`, `VehiculoDto.Cupones`
   - `CuponPeriodoDto.Cupones`
   - `ReporteCuponesDto.Detalle`
   - `VehiculoListResponseDto.Items` ✅ YA INICIALIZADO

3. **Aplicar mismo patrón a TODOS los DTOs** en:
   - `DTOs/Donacion/DonacionDtos.cs`
   - `DTOs/Donacion/DonacionLibroDtos.cs`
   - `DTOs/Personal/PersonalDtos.cs`
   - `DTOs/Personal/AccesoSistemaUpdateDto.cs`
   - `DTOs/Inventario/InventarioDtos.cs`
   - `DTOs/Roles/RolDtos.cs`
   - `DTOs/Seguridad/*.cs`
   - `DTOs/Catalogos/RangoDtos.cs`
   - `DTOs/Configuracion/ConfiguracionDtos.cs`
   - `DTOs/AuthResponseDto.cs`
   - `DTOs/LoginDto.cs`
   - `DTOs/EmergenciaCreateDto.cs`
   - `DTOs/EmergenciaUpdateDto.cs`

---

## FASE 2: Servicios - CA1822 (Métodos a static)

**Regla**: Métodos `private` que **NO usan `this`** → agregar `static`

### Verificar y corregir en cada servicio:

| Archivo | Métodos a revisar |
|---------|-------------------|
| `CuponService.cs` | ✅ YA SON STATIC (`Limpiar`, `NormalizarFirma`, `CalcularTotal`, `ValidarCupon`, `NombreMes`) |
| `VehiculoService.cs` | ✅ YA SON STATIC (`Validar`, `ValidarMantenimiento`, `ConstruirNombre`, `Limpiar`, `Normalizar`, `Parametros`) |
| `EmergenciaService.cs` | ✅ `ResolverNombreVehiculo`, `NormalizarRol` YA SON STATIC<br>❌ `ValidarPropiedadEmergencia` **USA `_currentUser` - NO CAMBIAR** |
| `DonacionService.cs` | Verificar `MapearCategoria` ✅ YA STATIC |
| `DonacionLibroService.cs` | Verificar `Validar` ✅ YA STATIC |
| `PersonalService.cs` | Verificar `GenerarCodigo`, `BuildNombreCompleto`, `NormalizeOptional` ✅ YA STATIC |
| `InventarioService.cs` | Revisar TODOS los `private` no-static |
| `RolService.cs` | Revisar TODOS los `private` no-static |
| `RangoService.cs` | Revisar TODOS los `private` no-static |
| `CuponService.cs` | Revisar `EnsurePeriodoAsync`, `RecalcularTodosAsync`, `LeerPeriodoAsync` - usan `this`? |
| `VehiculoService.cs` | Revisar `AbrirConexion`, `SincronizarDonacionEInventarioAsync`, `RecalcularEstadoOperativoAsync` - usan `this._context` |

**Solo cambiar los que NO acceden a campos de instancia (`_context`, `_currentUser`, etc.)**

---

## FASE 3: Servicios - Null-safety en Dapper

**Patrón a corregir en TODOS los servicios:**

```csharp
// ANTES (genera squiggle CS8600/CS8603)
var entity = await connection.QueryFirstOrDefaultAsync<EntityDto>(sql, param);
return ServiceResult<EntityDto>.Success(entity);

// DESPUÉS
var entity = await connection.QueryFirstOrDefaultAsync<EntityDto>(sql, param);
if (entity is null)
    return ServiceResult<EntityDto>.NotFound("Entidad no encontrada.");
return ServiceResult<EntityDto>.Success(entity);
```

### Archivos a revisar y corregir:
- `CuponService.cs` → `LeerPeriodoAsync` ✅ YA VALIDA
- `VehiculoService.cs` → `GetByIdAsync` ✅ YA VALIDA
- `EmergenciaService.cs` → `ObtenerEmergenciaPorIdAsync` ✅ YA VALIDA (retorna null)
- `InventarioService.cs` → **REVISAR TODOS** `QueryFirstOrDefaultAsync`
- `DonacionService.cs` → **REVISAR TODOS**
- `PersonalService.cs` → **REVISAR TODOS**
- `RolService.cs` → **REVISAR TODOS**
- `RangoService.cs` → **REVISAR TODOS**
- `DonacionLibroService.cs` → **REVISAR TODOS**

**También revisar**: `QuerySingleAsync` (lanza excepción si null - OK), `QueryAsync` + `FirstOrDefault()` (puede ser null)

---

## FASE 4: Controladores - Parámetros Nullable

### Archivo: `Controllers/CuponesController.cs`

```csharp
// ANTES
public async Task<IActionResult> SavePeriodo([FromBody] CuponPeriodoCreateDto dto)

// DESPUÉS
public async Task<IActionResult> SavePeriodo([FromBody] CuponPeriodoCreateDto? dto)
{
    if (dto is null) return InvalidModel(ModelState); // o BadRequest
    // ...resto igual
}
```

**Aplicar a TODOS los endpoints con `[FromBody]` en TODOS los controladores:**
- `CuponesController.cs`
- `VehiculosController.cs`
- `EmergenciasController.cs`
- `DonacionesController.cs`
- `DonacionLibroController.cs`
- `AuthController.cs`
- `PersonalController.cs`
- `RolesController.cs`
- `InventarioController.cs`
- `ConfiguracionController.cs`
- `CatalogosController.cs`
- `SeguridadController.cs`
- `PermissionController.cs`

---

## FASE 5: .csproj - Actualizar Paquetes (CUIDADO)

**Actualizar en `Backend_Sub33.csproj` (verificar compatibilidad net8.0):**

```xml
<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.11" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.14" />
<PackageReference Include="Microsoft.IdentityModel.Tokens" Version="8.12.0" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.12.0" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="6.8.0" />
<!-- Dapper 2.1.79 mantener si estable, o bajar a 2.1.35 LTS -->
<!-- BCrypt.Net-Next 4.2.0 mantener o bajar a 4.0.3 -->
```

**⚠️ IMPORTANTE**: 
- Hacer en rama separada
- Ejecutar `dotnet build` y `dotnet test` después de cada actualización
- Revisar breaking changes en release notes

---

## FASE 6: .editorconfig - Opcional (Solo si el equipo acuerda)

Cambiar `suggestion` → `warning` para CI estricto:
```ini
dotnet_diagnostic.IDE0060.severity = warning
dotnet_diagnostic.IDE0059.severity = warning
dotnet_diagnostic.CA1822.severity = warning
dotnet_diagnostic.CA2000.severity = warning
dotnet_diagnostic.CA2007.severity = warning
```

---

## ✅ VERIFICACIÓN FINAL (EJECUTAR EN ORDEN)

```bash
# 1. Build limpio
dotnet build --no-restore

# 2. Analizadores estrictos
dotnet build --no-restore /p:RunAnalyzers=true /p:EnforceCodeStyleInBuild=true

# 3. Formato consistente
dotnet format --verify-no-changes

# 4. Tests (si existen)
dotnet test --no-restore
```

**Todos deben pasar con 0 warnings, 0 errores.**

---

## 🚫 REGLAS DE ORO - NO ROMPER

1. **NO cambiar lógica de negocio** - solo nullability, static, inicialización
2. **NO cambiar firmas públicas** de interfaces (`ICuponService`, `IVehiculoService`, etc.)
3. **NO eliminar validaciones existentes** - solo agregar null-checks donde falten
4. **NO cambiar `ServiceResult<T>`** - patrón establecido
5. **NO tocar migraciones EF** (`Migrations/*.cs`)
6. **Probar cada cambio** con build antes de continuar

---

## 📁 ARCHIVOS DE REFERENCIA (Leer antes de empezar)

- `PLAN_MEJORAS_WARNINGS.md` - Este plan detallado
- `.editorconfig` - Reglas configuradas
- `Backend_Sub33.csproj` - Configuración proyecto
- `Common/ServiceResult.cs` - Patrón de resultado
- `Controllers/ApiControllerBase.cs` - Base controladores

---

## 🎯 ENTREGABLE

Código modificado que:
1. Compila sin warnings ni errores (`dotnet build`)
2. Pasa analizadores estrictos (`/p:RunAnalyzers=true /p:EnforceCodeStyleInBuild=true`)
3. Pasa `dotnet format --verify-no-changes`
4. Mantiene **100% funcionalidad idéntica** a la actual
5. Elimina squiggles en IDE para los archivos modificados