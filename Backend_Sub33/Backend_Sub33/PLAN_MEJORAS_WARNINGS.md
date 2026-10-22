# Plan de Mejoras - Eliminación de Advertencias IDE (Squiggles)

**Estado actual**: Build limpio (0 warnings, 0 errores). Las advertencias visibles son **sugerencias de IDE** por reglas en `.editorconfig` con severidad `suggestion`.

---

## ✅ FASE 1: DTOs - Nullability & Inicialización (Alto impacto, bajo riesgo)

### Archivos: `DTOs/Vehiculos/VehiculoDtos.cs`

| Regla | Problema | Solución |
|-------|----------|----------|
| **CS8618** | Propiedades `string` non-nullable sin inicializar: `Marca`, `Modelo`, `Responsable`, `Tipo`, `Estado`, `EstadoOperativo`, `Origen`, `Combustible`, `CondicionLlantas`, `VolanteDireccion`, `NoUnidad`, `Motor`, `Chasis`, `Placa`, `Color`, `Ubicacion`, `Donante`, `DpiNit`, `Telefono`, `NoReciboDonacion`, `ElaboradoPor`, `JefeAbastecimientos`, `Jefe33Cia`, `Director`, `FirmaElaboradoPorBase64`, `FirmaJefeAbastecimientosBase64`, `FirmaJefe33CiaBase64`, `FirmaDirectorBase64`, `MesNombre`, `Nombre` (FirmaReporteDto) | Usar `required` (C# 11) o inicializar con `= ""` |
| **CS8618** | Colecciones sin inicializar: `Mantenimientos`, `Cupones` (en `VehiculoDto`), `Cupones` (en `CuponPeriodoDto`), `Detalle` (en `ReporteCuponesDto`), `Items` (en `VehiculoListResponseDto`) | Inicializar con `= new()` |
| **IDE0028** | Inicialización redundante: `= new()` en propiedades que ya se inicializan en constructor o factory | Simplificar |

### Archivos: `DTOs/Donacion/DonacionDtos.cs`, `DTOs/Donacion/DonacionLibroDtos.cs`, `DTOs/Personal/PersonalDtos.cs`, `DTOs/Inventario/InventarioDtos.cs`, `DTOs/Roles/RolDtos.cs`, `DTOs/Seguridad/*.cs`, `DTOs/Catalogos/RangoDtos.cs`, `DTOs/Configuracion/ConfiguracionDtos.cs`, `DTOs/AuthResponseDto.cs`, `DTOs/LoginDto.cs`, `DTOs/Emergencia*.cs`

Aplicar mismo patrón: `required` / `= ""` / `= new()` en todas las propiedades non-nullable.

---

## ✅ FASE 2: Servicios - CA1822 (Métodos que pueden ser static)

### Archivos afectados (métodos `private` que no usan `this`):

| Archivo | Métodos a convertir a `static` |
|---------|-------------------------------|
| `CuponService.cs` | `Limpiar`, `NormalizarFirma`, `CalcularTotal`, `ValidarCupon`, `NombreMes` ✅ **YA SON STATIC** |
| `VehiculoService.cs` | `Validar`, `ValidarMantenimiento`, `ConstruirNombre`, `Limpiar`, `Normalizar`, `Parametros` ✅ **YA SON STATIC** |
| `EmergenciaService.cs` | `ResolverNombreVehiculo`, `NormalizarRol` ✅ **YA SON STATIC**<br>`ValidarPropiedadEmergencia` ❌ **USA `_currentUser` - NO CAMBIAR** |
| `DonacionService.cs` | `MapearCategoria` ✅ **YA ES STATIC** |
| `DonacionLibroService.cs` | `Validar` ✅ **YA ES STATIC** |
| `PersonalService.cs` | `GenerarCodigo`, `BuildNombreCompleto`, `NormalizeOptional` ✅ **YA SON STATIC** |
| `InventarioService.cs` | Revisar métodos privados |
| `RolService.cs`, `RangoService.cs`, `PersonalService.cs` | Revisar métodos privados |

**Acción**: Verificar cada servicio y marcar `static` los métodos privados que no acceden a campos de instancia.

---

## ✅ FASE 3: Servicios - Null-safety en consultas Dapper

### Patrón actual (genera CS8600/CS8603 en IDE):
```csharp
var result = await connection.QueryFirstOrDefaultAsync<T>(sql, param);
return ServiceResult<T>.Success(result); // result puede ser null
```

### Corrección:
```csharp
var result = await connection.QueryFirstOrDefaultAsync<T>(sql, param);
if (result is null)
    return ServiceResult<T>.NotFound("Recurso no encontrado.");
return ServiceResult<T>.Success(result);
```

### Archivos a revisar:
- `CuponService.cs` ✅ **Ya valida null en `LeerPeriodoAsync`**
- `VehiculoService.cs` ✅ **Ya valida null en `GetByIdAsync`**
- `EmergenciaService.cs` ✅ **Ya valida null**
- `InventarioService.cs`, `DonacionService.cs`, `PersonalService.cs`, `RolService.cs`, `RangoService.cs` - **Revisar**

---

## ✅ FASE 4: Controladores - Parámetros nullable

### Archivo: `Controllers/CuponesController.cs`

| Método | Parámetro | Cambio |
|--------|-----------|--------|
| `SavePeriodo` | `CuponPeriodoCreateDto dto` | `CuponPeriodoCreateDto? dto` + validar `dto is not null` |
| `CreateCupon` | `CuponCreateDto dto` | `CuponCreateDto? dto` + validar |
| `UpdateCupon` | `CuponUpdateDto dto` | `CuponUpdateDto? dto` + validar |

**Nota**: Los demás controladores (`VehiculosController`, `EmergenciasController`, `DonacionesController`, `AuthController`, etc.) aplicar mismo patrón.

---

## ✅ FASE 5: .csproj - Actualización de paquetes NuGet

| Paquete | Actual | Recomendado (net8.0) |
|---------|--------|---------------------|
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 8.0.4 | 8.0.11+ |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 8.0.11 | 8.0.14+ |
| `Microsoft.IdentityModel.Tokens` | 8.22.0 | 8.12.0+ |
| `System.IdentityModel.Tokens.Jwt` | 8.22.0 | 8.12.0+ |
| `Swashbuckle.AspNetCore` | 6.6.2 | 6.8.0+ |
| `Dapper` | 2.1.79 | 2.1.35 (LTS) o 2.1.79 si estable |
| `BCrypt.Net-Next` | 4.2.0 | 4.0.3 (estable) |

**Verificar compatibilidad** antes de actualizar (breaking changes en major versions).

---

## ✅ FASE 6: .editorconfig - Promocionar sugerencias a warning (Opcional)

Cambiar en `.editorconfig`:
```ini
# De suggestion a warning para CI estricto
dotnet_diagnostic.IDE0060.severity = warning  # Parámetros no usados
dotnet_diagnostic.IDE0059.severity = warning  # Valores no usados
dotnet_diagnostic.CA1822.severity = warning   # Métodos que pueden ser static
dotnet_diagnostic.CA2000.severity = warning   # Dispose
dotnet_diagnostic.CA2007.severity = warning   # ConfigureAwait(false)
```

---

## ❌ ELIMINADO DEL PLAN ANTERIOR (Ya resuelto / No aplica)

| Ítem anterior | Razán |
|---------------|-------|
| CS1998 (async sin await) | No hay casos reales - todos los `async` usan `await` correctamente |
| CS4014 (fire-and-forget) | No detectado en código |
| CA1031 (catch genérico) | Ya suprimido en `.editorconfig` (`severity = none`) - patrón intencional |
| CA1707 (namespace con guión bajo) | Ya suprimido - convención preexistente |
| CA1000 (static factory en tipos genéricos) | Ya suprimido - `ServiceResult<T>` usa patrón intencional |
| Globalización (CA1304, CA1305, CA1311, CA1862) | Ya suprimido - app single-locale (es-GT) |
| Micro-optimizaciones (CA1848, CA1859, CA1860, CA1861) | Ya suprimido - no críticas |
| `GenerateDocumentationFile` | Ya en `false` |
| `TreatWarningsAsErrors` | Ya en `true` - build fallaría si hubiera warnings reales |

---

## 📋 CHECKLIST DE VERIFICACIÓN POST-CAMBIOS

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

---

## 🎯 PRIORIDAD DE EJECUCIÓN

1. **Fase 1** (DTOs) - Impacto visual inmediato en IDE, bajo riesgo
2. **Fase 2** (CA1822) - Limpieza de código, sin cambio funcional
3. **Fase 3** (Null-safety Dapper) - Previene bugs runtime, medio riesgo
4. **Fase 4** (Controladores) - Consistencia, bajo riesgo
5. **Fase 5** (Paquetes) - Mantenimiento, probar en rama separada
6. **Fase 6** (Editorconfig) - Opcional, según política de equipo