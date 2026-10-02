using System.Text.RegularExpressions;
using Backend_Sub33.Common;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs.Personal;
using Backend_Sub33.Models;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace Backend_Sub33.Services;

public partial class PersonalService : IPersonalService
{
    private const string DpiPattern = @"^\d{13}$";

    private readonly AppDbContext _context;
    private readonly ILogger<PersonalService> _logger;

    public PersonalService(AppDbContext context, ILogger<PersonalService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ServiceResult<PaginatedResult<PersonalResumenDto>>> GetResumenAsync(
        int pagina, int tamanio, int? rangoId, bool? estado, CancellationToken ct = default)
    {
        try
        {
            pagina = Math.Max(1, pagina);
            tamanio = Math.Clamp(tamanio, 1, 100);

            var query = _context.Personal
                .AsNoTracking()
                .Include(p => p.Rango)
                .AsQueryable();

            if (rangoId.HasValue)
            {
                query = query.Where(p => p.RangoId == rangoId.Value);
            }

            if (estado.HasValue)
            {
                query = query.Where(p => p.Estado == estado.Value);
            }

            var total = await query.CountAsync(ct);

            var registros = await query
                .OrderBy(p => p.PrimerApellido)
                .ThenBy(p => p.PrimerNombre)
                .Skip((pagina - 1) * tamanio)
                .Take(tamanio)
                .ToListAsync(ct);

            var codigos = await BuildCodigoIndexAsync(ct);

            var ids = registros.Select(p => p.PersonalId).ToList();
            var usuariosPorPersonal = await ObtenerUsuariosPorPersonalAsync(ids, ct);

            var items = registros
                .Select(p => new PersonalResumenDto
                {
                    PersonalId = p.PersonalId.ToString(),
                    Codigo = GenerarCodigo(p.PersonalId, codigos),
                    CodigoBombero = p.CodigoBombero,
                    NombreCompleto = BuildNombreCompleto(p),
                    Dpi = p.Dpi,
                    RangoId = p.RangoId,
                    RangoNombre = p.Rango?.Rango,
                    Estado = p.Estado,
                    Telefono = p.Telefono,
                    ContactoEmergenciaNombre = p.ContactoEmergenciaNombre ?? string.Empty,
                    ContactoEmergenciaTelefono = p.ContactoEmergenciaTelefono ?? string.Empty,
                    FechaIngreso = p.FechaIngreso.ToString("yyyy-MM-dd"),
                    TieneUsuario = usuariosPorPersonal.ContainsKey(p.PersonalId)
                })
                .ToList();

            var resultado = new PaginatedResult<PersonalResumenDto>
            {
                Pagina = pagina,
                Tamanio = tamanio,
                Total = total,
                TotalPaginas = (int)Math.Ceiling(total / (double)tamanio),
                Items = items
            };

            return ServiceResult<PaginatedResult<PersonalResumenDto>>.Success(resultado);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener el listado de personal");
            return ServiceResult<PaginatedResult<PersonalResumenDto>>.Internal("Error al obtener el listado de personal.");
        }
    }

    public async Task<ServiceResult<PersonalResponseDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        try
        {
            var personal = await _context.Personal
                .AsNoTracking()
                .Include(p => p.Rango)
                .FirstOrDefaultAsync(p => p.PersonalId == id, ct);

            if (personal is null)
            {
                return ServiceResult<PersonalResponseDto>.NotFound("Personal no encontrado.");
            }

            var usuario = await _context.Usuarios
                .AsNoTracking()
                .Include(u => u.UsuarioRoles)
                .ThenInclude(ur => ur.Rol)
                .FirstOrDefaultAsync(u => u.PersonalId == id, ct);

            var codigos = await BuildCodigoIndexAsync(ct);

            return ServiceResult<PersonalResponseDto>.Success(
                MapResponse(personal, usuario, GenerarCodigo(personal.PersonalId, codigos)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener el personal {Id}", id);
            return ServiceResult<PersonalResponseDto>.Internal("Error al obtener el personal.");
        }
    }

    public async Task<ServiceResult<PersonalResponseDto>> CreateAsync(CreatePersonalDto dto, CancellationToken ct = default)
    {
        try
        {
            var dpi = dto.Dpi.Trim();

            var dpiExiste = await _context.Personal.AnyAsync(p => p.Dpi == dpi, ct);
            if (dpiExiste)
            {
                return ServiceResult<PersonalResponseDto>.Conflict("El DPI ya se encuentra registrado.");
            }

            if (dto.RangoId <= 0)
            {
                return ServiceResult<PersonalResponseDto>.BadRequest("El rango es requerido.");
            }

            var rangoExiste = await _context.CatRangos.AnyAsync(r => r.RangoId == dto.RangoId, ct);
            if (!rangoExiste)
            {
                return ServiceResult<PersonalResponseDto>.BadRequest("El rango seleccionado no existe.");
            }

            string? username = null;
            string? passwordHash = null;
            int rolId = 0;

            if (dto.AccesoSistema is not null)
            {
                username = dto.AccesoSistema.Username.Trim();
                if (string.IsNullOrWhiteSpace(username))
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El nombre de usuario es requerido.");
                }

                if (dto.AccesoSistema.Password.Length < 8)
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("La contraseña debe tener al menos 8 caracteres.");
                }

                if (dto.AccesoSistema.RolId <= 0)
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El rol del sistema es requerido.");
                }

                var usuarioExiste = await _context.Usuarios.AnyAsync(u => u.Username.ToLower() == username.ToLower(), ct);
                if (usuarioExiste)
                {
                    return ServiceResult<PersonalResponseDto>.Conflict("El nombre de usuario ya existe.");
                }

                var rolExiste = await _context.Roles.AnyAsync(r => r.RolId == dto.AccesoSistema.RolId, ct);
                if (!rolExiste)
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El rol del sistema seleccionado no existe.");
                }

                rolId = dto.AccesoSistema.RolId;
                passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.AccesoSistema.Password);
            }

            string codigoBombero;
            if (string.IsNullOrWhiteSpace(dto.CodigoBombero))
            {
                var correlativo = await _context.Personal.CountAsync(ct) + 1;
                codigoBombero = $"BOM-{correlativo:D4}";
            }
            else
            {
                codigoBombero = dto.CodigoBombero.Trim().ToUpper();
            }

            using var transaction = await _context.Database.BeginTransactionAsync(ct);

            try
            {
                var personal = new Personal
                {
                    PersonalId = Guid.NewGuid(),
                    PrimerNombre = dto.PrimerNombre.Trim(),
                    SegundoNombre = NormalizeOptional(dto.SegundoNombre),
                    PrimerApellido = dto.PrimerApellido.Trim(),
                    SegundoApellido = NormalizeOptional(dto.SegundoApellido),
                    Dpi = dpi,
                    FechaNacimiento = dto.FechaNacimiento,
                    RangoId = dto.RangoId,
                    CodigoBombero = codigoBombero,
                    FechaIngreso = dto.FechaIngreso ?? DateTime.Today,
                    Telefono = dto.Telefono.Trim(),
                    Estado = dto.Estado,
                    ContactoEmergenciaNombre = (dto.ContactoEmergenciaNombre ?? "").Trim(),
                    ContactoEmergenciaTelefono = (dto.ContactoEmergenciaTelefono ?? "").Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Personal.Add(personal);
                await _context.SaveChangesAsync(ct);

                if (username is not null)
                {
                    var usuario = new Usuario
                    {
                        UsuarioId = Guid.NewGuid(),
                        PersonalId = personal.PersonalId,
                        Username = username.ToLower(),
                        PasswordHash = passwordHash!,
                        Estado = dto.Estado,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Usuarios.Add(usuario);
                    await _context.SaveChangesAsync(ct);

                    _context.UsuarioRoles.Add(new UsuarioRol
                    {
                        UsuarioId = usuario.UsuarioId,
                        RolId = rolId
                    });
                    await _context.SaveChangesAsync(ct);
                }

                await transaction.CommitAsync(ct);

                var creado = await GetByIdAsync(personal.PersonalId, ct);
                if (!creado.IsSuccess)
                {
                    return ServiceResult<PersonalResponseDto>.From(creado);
                }

                return ServiceResult<PersonalResponseDto>.Success(creado.Data!);
            }
            catch
            {
                try
                {
                    await transaction.RollbackAsync(ct);
                }
                catch (Exception rollbackEx)
                {
                    _logger.LogWarning(rollbackEx, "Error al revertir la transacción de registro de personal");
                }

                throw;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al registrar el personal");
            return ServiceResult<PersonalResponseDto>.Internal("Error al registrar el personal.");
        }
    }

    public async Task<ServiceResult<PersonalResponseDto>> UpdateAsync(Guid id, UpdatePersonalDto dto, CancellationToken ct = default)
    {
        try
        {
            var personal = await _context.Personal.FirstOrDefaultAsync(p => p.PersonalId == id, ct);
            if (personal is null)
            {
                return ServiceResult<PersonalResponseDto>.NotFound("Personal no encontrado.");
            }

            if (dto.Dpi is not null)
            {
                var dpi = dto.Dpi.Trim();
                if (string.IsNullOrWhiteSpace(dpi))
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El DPI no puede estar vacío.");
                }

                if (!DpiRegex().IsMatch(dpi))
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El DPI debe ser una cadena numérica de 13 dígitos.");
                }

                if (dpi != personal.Dpi)
                {
                    var dpiExiste = await _context.Personal.AnyAsync(p => p.Dpi == dpi && p.PersonalId != id, ct);
                    if (dpiExiste)
                    {
                        return ServiceResult<PersonalResponseDto>.Conflict("El DPI ya se encuentra registrado.");
                    }

                    personal.Dpi = dpi;
                }
            }

            if (dto.RangoId.HasValue)
            {
                if (dto.RangoId.Value <= 0)
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El rango no es válido.");
                }

                var rangoExiste = await _context.CatRangos.AnyAsync(r => r.RangoId == dto.RangoId.Value, ct);
                if (!rangoExiste)
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El rango seleccionado no existe.");
                }

                personal.RangoId = dto.RangoId.Value;
            }

            if (dto.CodigoBombero is not null)
            {
                var codigo = dto.CodigoBombero.Trim().ToUpper();
                if (codigo.Length == 0)
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El código de bombero no puede estar vacío.");
                }

                if (codigo != personal.CodigoBombero)
                {
                    var codigoExiste = await _context.Personal.AnyAsync(p => p.CodigoBombero == codigo && p.PersonalId != id, ct);
                    if (codigoExiste)
                    {
                        return ServiceResult<PersonalResponseDto>.Conflict("El código de bombero ya se encuentra registrado.");
                    }

                    personal.CodigoBombero = codigo;
                }
            }

            if (dto.PrimerNombre is not null)
            {
                var valor = dto.PrimerNombre.Trim();
                if (valor.Length == 0)
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El primer nombre es requerido.");
                }

                personal.PrimerNombre = valor;
            }

            if (dto.SegundoNombre is not null)
            {
                personal.SegundoNombre = NormalizeOptional(dto.SegundoNombre);
            }

            if (dto.PrimerApellido is not null)
            {
                var valor = dto.PrimerApellido.Trim();
                if (valor.Length == 0)
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El primer apellido es requerido.");
                }

                personal.PrimerApellido = valor;
            }

            if (dto.SegundoApellido is not null)
            {
                personal.SegundoApellido = NormalizeOptional(dto.SegundoApellido);
            }

            if (dto.Telefono is not null)
            {
                var valor = dto.Telefono.Trim();
                if (valor.Length == 0)
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El teléfono es requerido.");
                }

                personal.Telefono = valor;
            }

            if (dto.ContactoEmergenciaNombre is not null)
            {
                var valor = dto.ContactoEmergenciaNombre.Trim();
                if (valor.Length == 0)
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El nombre del contacto de emergencia es requerido.");
                }

                personal.ContactoEmergenciaNombre = valor;
            }

            if (dto.ContactoEmergenciaTelefono is not null)
            {
                var valor = dto.ContactoEmergenciaTelefono.Trim();
                if (valor.Length == 0)
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El teléfono del contacto de emergencia es requerido.");
                }

                personal.ContactoEmergenciaTelefono = valor;
            }

            if (dto.FechaNacimiento.HasValue)
            {
                personal.FechaNacimiento = dto.FechaNacimiento.Value;
            }

            if (dto.FechaIngreso.HasValue)
            {
                personal.FechaIngreso = dto.FechaIngreso.Value;
            }

            personal.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);

            return await GetByIdAsync(id, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar el personal {Id}", id);
            return ServiceResult<PersonalResponseDto>.Internal("Error al actualizar el personal.");
        }
    }

    public async Task<ServiceResult> ChangeEstadoAsync(Guid id, bool estado, CancellationToken ct = default)
    {
        try
        {
            var personal = await _context.Personal.FirstOrDefaultAsync(p => p.PersonalId == id, ct);
            if (personal is null)
            {
                return ServiceResult.NotFound("Personal no encontrado.");
            }

            personal.Estado = estado;
            personal.UpdatedAt = DateTime.UtcNow;

            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.PersonalId == id, ct);
            if (usuario is not null)
            {
                usuario.Estado = estado;
                usuario.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(ct);

            return ServiceResult.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al cambiar el estado del personal {Id}", id);
            return ServiceResult.Internal("Error al cambiar el estado del personal.");
        }
    }

    public async Task<ServiceResult> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        try
        {
            var personal = await _context.Personal.FirstOrDefaultAsync(p => p.PersonalId == id, ct);
            if (personal is null)
            {
                return ServiceResult.NotFound("Personal no encontrado.");
            }

            personal.Estado = false;
            personal.UpdatedAt = DateTime.UtcNow;

            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.PersonalId == id, ct);
            if (usuario is not null)
            {
                usuario.Estado = false;
                usuario.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(ct);

            return ServiceResult.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al desactivar el personal {Id}", id);
            return ServiceResult.Internal("Error al desactivar el personal.");
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private async Task<Dictionary<Guid, int>> BuildCodigoIndexAsync(CancellationToken ct)
    {
        var ids = await _context.Personal
            .AsNoTracking()
            .OrderBy(p => p.CreatedAt)
            .ThenBy(p => p.PersonalId)
            .Select(p => p.PersonalId)
            .ToListAsync(ct);

        var index = new Dictionary<Guid, int>(ids.Count);
        for (var i = 0; i < ids.Count; i++)
        {
            index[ids[i]] = i + 1;
        }

        return index;
    }

    private async Task<Dictionary<Guid, string>> ObtenerUsuariosPorPersonalAsync(List<Guid> ids, CancellationToken ct)
    {
        if (ids.Count == 0)
        {
            return new Dictionary<Guid, string>();
        }

        return await _context.Usuarios
            .AsNoTracking()
            .Where(u => u.PersonalId.HasValue && ids.Contains(u.PersonalId.Value))
            .ToDictionaryAsync(u => u.PersonalId!.Value, u => u.Username, ct);
    }

    private static string GenerarCodigo(Guid id, IReadOnlyDictionary<Guid, int> index)
        => index.TryGetValue(id, out var secuencia) ? $"BOM-{secuencia:D4}" : "BOM-0000";

    private static string BuildNombreCompleto(Personal p)
    {
        var partes = new[] { p.PrimerNombre, p.SegundoNombre, p.PrimerApellido, p.SegundoApellido }
            .Where(n => !string.IsNullOrWhiteSpace(n));
        return string.Join(' ', partes);
    }

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static PersonalResponseDto MapResponse(Personal p, Usuario? usuario, string codigo)
    {
        var rolPrincipal = usuario?.UsuarioRoles.FirstOrDefault();

        return new PersonalResponseDto
        {
            PersonalId = p.PersonalId,
            Codigo = codigo,
            CodigoBombero = p.CodigoBombero,
            PrimerNombre = p.PrimerNombre,
            SegundoNombre = p.SegundoNombre,
            PrimerApellido = p.PrimerApellido,
            SegundoApellido = p.SegundoApellido,
            NombreCompleto = BuildNombreCompleto(p),
            Dpi = p.Dpi,
            FechaNacimiento = p.FechaNacimiento,
            RangoId = p.RangoId,
            RangoNombre = p.Rango?.Rango,
            FechaIngreso = p.FechaIngreso,
            Telefono = p.Telefono,
            Estado = p.Estado,
            ContactoEmergenciaNombre = p.ContactoEmergenciaNombre,
            ContactoEmergenciaTelefono = p.ContactoEmergenciaTelefono,
            Usuario = usuario is null
                ? null
                : new UsuarioAccesoDto
                {
                    UsuarioId = usuario.UsuarioId,
                    Username = usuario.Username,
                    Estado = usuario.Estado,
                    RolId = rolPrincipal?.RolId,
                    Rol = rolPrincipal?.Rol?.Nombre
                }
        };
    }

    [GeneratedRegex(DpiPattern)]
    private static partial Regex DpiRegex();
}
