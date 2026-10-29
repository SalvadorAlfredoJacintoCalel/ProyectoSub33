using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Net.Mail;
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
    private readonly IEmailService _emailService;

    public PersonalService(AppDbContext context, ILogger<PersonalService> logger, IEmailService emailService)
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
    }

    public async Task<ServiceResult<PaginatedResult<PersonalResumenDto>>> GetResumenAsync(
        int pagina, int tamanio, int? rangoId, bool? estado, string? busqueda, CancellationToken ct = default)
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

            var termino = TextNormalizer.NormalizeSearch(busqueda);
            if (termino.Length > 0)
            {
                var tokens = termino.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                foreach (var token in tokens)
                {
                    var pattern = $"%{token}%";
                    query = query.Where(p =>
                        EF.Functions.ILike(p.SearchText ?? string.Empty, pattern) ||
                        _context.Usuarios.Any(u =>
                            u.PersonalId == p.PersonalId &&
                            EF.Functions.ILike(u.Username, pattern)));
                }
            }

            var raw = (busqueda ?? string.Empty).Trim().ToLowerInvariant();
            if (raw.Length > 0)
            {
                query = query
                    .OrderByDescending(p =>
                        p.Dpi.ToLower() == raw ||
                        (p.CodigoBombero != null && p.CodigoBombero.ToLower() == raw))
                    .ThenBy(p => p.PrimerApellido)
                    .ThenBy(p => p.PrimerNombre);
            }
            else
            {
                query = query
                    .OrderBy(p => p.PrimerApellido)
                    .ThenBy(p => p.PrimerNombre);
            }

            var total = await query.CountAsync(ct);

            var registros = await query
                .Skip((pagina - 1) * tamanio)
                .Take(tamanio)
                .ToListAsync(ct);

            var ids = registros.Select(p => p.PersonalId).ToList();
            var usuariosPorPersonal = await ObtenerUsuariosPorPersonalAsync(ids, ct);
            var rolesPorPersonal = await ObtenerRolesPorPersonalAsync(ids, ct);

            var items = registros
                .Select(p => new PersonalResumenDto
                {
                    PersonalId = p.PersonalId.ToString(),
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
                    TieneUsuario = usuariosPorPersonal.ContainsKey(p.PersonalId),
                    Username = usuariosPorPersonal.GetValueOrDefault(p.PersonalId),
                    RolNombre = rolesPorPersonal.GetValueOrDefault(p.PersonalId)
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

            return ServiceResult<PersonalResponseDto>.Success(
                MapResponse(personal, usuario));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener el personal {Id}", id);
            return ServiceResult<PersonalResponseDto>.Internal("Error al obtener el personal.");
        }
    }

    public async Task<ServiceResult<PersonalEstadisticasDto>> GetEstadisticasAsync(CancellationToken ct = default)
    {
        try
        {
            var total = await _context.Personal.AsNoTracking().CountAsync(ct);
            var activos = await _context.Personal.AsNoTracking().CountAsync(p => p.Estado, ct);

            return ServiceResult<PersonalEstadisticasDto>.Success(new PersonalEstadisticasDto
            {
                Total = total,
                Activos = activos,
                Inactivos = total - activos
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener las estadísticas de personal");
            return ServiceResult<PersonalEstadisticasDto>.Internal("Error al obtener las estadísticas de personal.");
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
            string? email = null;
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

                email = dto.AccesoSistema.Email.Trim().ToLowerInvariant();
                if (string.IsNullOrWhiteSpace(email))
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El correo electrónico es requerido.");
                }

                if (!EsEmailValido(email))
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El correo electrónico no es válido.");
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

                var emailExiste = await _context.Usuarios.AnyAsync(u => u.Email != null && u.Email.ToLower() == email, ct);
                if (emailExiste)
                {
                    return ServiceResult<PersonalResponseDto>.Conflict("El correo electrónico ya está registrado.");
                }

                var rolExiste = await _context.Roles.AnyAsync(r => r.RolId == dto.AccesoSistema.RolId, ct);
                if (!rolExiste)
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El rol del sistema seleccionado no existe.");
                }

                rolId = dto.AccesoSistema.RolId;
                passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.AccesoSistema.Password);
            }

            if (string.IsNullOrWhiteSpace(dto.CodigoBombero))
            {
                return ServiceResult<PersonalResponseDto>.BadRequest("El código de bombero es requerido.");
            }

            var codigoBombero = dto.CodigoBombero.Trim().ToUpper();

            var codigoExiste = await _context.Personal.AnyAsync(p => p.CodigoBombero == codigoBombero, ct);
            if (codigoExiste)
            {
                return ServiceResult<PersonalResponseDto>.Conflict("El código de bombero ya existe.");
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
                        Email = email,
                        DebeCambiarContrasena = true,
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

                if (dto.AccesoSistema is not null)
                {
                    var enviado = await TryEnviarCredencialesAsync(
                        email, personal.PrimerNombre, username, dto.AccesoSistema.Password, esCuentaNueva: true, ct);
                    if (!enviado)
                    {
                        _logger.LogWarning("No se enviaron las credenciales al crear el usuario {Username}", username);
                    }
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
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("dpi") == true)
        {
            _logger.LogWarning(ex, "DPI duplicado al registrar personal");
            return ServiceResult<PersonalResponseDto>.Conflict("El DPI ya se encuentra registrado.");
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("username") == true)
        {
            _logger.LogWarning(ex, "Nombre de usuario duplicado al registrar personal");
            return ServiceResult<PersonalResponseDto>.Conflict("El nombre de usuario ya existe.");
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

            if (string.IsNullOrWhiteSpace(dto.CodigoBombero))
            {
                return ServiceResult<PersonalResponseDto>.BadRequest("El código de bombero es requerido.");
            }

            var codigo = dto.CodigoBombero.Trim().ToUpper();

            if (codigo != personal.CodigoBombero)
            {
                var codigoExiste = await _context.Personal.AnyAsync(p => p.CodigoBombero == codigo && p.PersonalId != id, ct);
                if (codigoExiste)
                {
                    return ServiceResult<PersonalResponseDto>.Conflict("El código de bombero ya se encuentra registrado.");
                }

                personal.CodigoBombero = codigo;
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

            string? accessUsername = null;
            string? accessPasswordHash = null;
            string? accessEmail = null;
            var accessRolId = 0;
            var enviarCredenciales = false;
            var cuentaNueva = false;

            if (dto.AccesoSistema is not null)
            {
                accessUsername = dto.AccesoSistema.Username.Trim();
                if (string.IsNullOrWhiteSpace(accessUsername))
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El nombre de usuario es requerido.");
                }

                accessEmail = dto.AccesoSistema.Email.Trim().ToLowerInvariant();
                if (string.IsNullOrWhiteSpace(accessEmail))
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El correo electrónico es requerido.");
                }

                if (!EsEmailValido(accessEmail))
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El correo electrónico no es válido.");
                }

                accessRolId = dto.AccesoSistema.RolId;
                if (accessRolId <= 0)
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El rol del sistema es requerido.");
                }

                var rolExiste = await _context.Roles.AnyAsync(r => r.RolId == accessRolId, ct);
                if (!rolExiste)
                {
                    return ServiceResult<PersonalResponseDto>.BadRequest("El rol del sistema seleccionado no existe.");
                }

                var usernameOcupado = await _context.Usuarios.AnyAsync(
                    u => u.Username.ToLower() == accessUsername.ToLower() && u.PersonalId != id, ct);
                if (usernameOcupado)
                {
                    return ServiceResult<PersonalResponseDto>.Conflict("El nombre de usuario ya existe.");
                }

                var emailOcupado = await _context.Usuarios.AnyAsync(
                    u => u.Email != null && u.Email.ToLower() == accessEmail && u.PersonalId != id, ct);
                if (emailOcupado)
                {
                    return ServiceResult<PersonalResponseDto>.Conflict("El correo electrónico ya está registrado.");
                }

                var usuarioActual = await _context.Usuarios.FirstOrDefaultAsync(u => u.PersonalId == id, ct);
                var password = dto.AccesoSistema.Password ?? string.Empty;

                if (usuarioActual is null)
                {
                    if (password.Length < 8)
                    {
                        return ServiceResult<PersonalResponseDto>.BadRequest("La contraseña debe tener al menos 8 caracteres.");
                    }

                    accessPasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
                }
                else if (!string.IsNullOrWhiteSpace(password))
                {
                    if (password.Length < 8)
                    {
                        return ServiceResult<PersonalResponseDto>.BadRequest("La contraseña debe tener al menos 8 caracteres.");
                    }

                    accessPasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
                }
            }

            personal.UpdatedAt = DateTime.UtcNow;

            using var transaction = await _context.Database.BeginTransactionAsync(ct);

            try
            {
                await _context.SaveChangesAsync(ct);

                if (accessUsername is not null)
                {
                    var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.PersonalId == id, ct);

                    if (usuario is null)
                    {
                        usuario = new Usuario
                        {
                            UsuarioId = Guid.NewGuid(),
                            PersonalId = id,
                            Username = accessUsername.ToLower(),
                            PasswordHash = accessPasswordHash!,
                            Email = accessEmail,
                            DebeCambiarContrasena = true,
                            Estado = personal.Estado,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        _context.Usuarios.Add(usuario);
                        await _context.SaveChangesAsync(ct);

                        _context.UsuarioRoles.Add(new UsuarioRol
                        {
                            UsuarioId = usuario.UsuarioId,
                            RolId = accessRolId
                        });
                        await _context.SaveChangesAsync(ct);

                        enviarCredenciales = true;
                        cuentaNueva = true;
                    }
                    else
                    {
                        usuario.Username = accessUsername.ToLower();
                        usuario.Email = accessEmail;
                        if (accessPasswordHash is not null)
                        {
                            usuario.PasswordHash = accessPasswordHash;
                            enviarCredenciales = true;
                        }

                        usuario.Estado = personal.Estado;
                        usuario.UpdatedAt = DateTime.UtcNow;

                        var rolesActuales = await _context.UsuarioRoles
                            .Where(ur => ur.UsuarioId == usuario.UsuarioId)
                            .ToListAsync(ct);
                        _context.UsuarioRoles.RemoveRange(rolesActuales);

                        _context.UsuarioRoles.Add(new UsuarioRol
                        {
                            UsuarioId = usuario.UsuarioId,
                            RolId = accessRolId
                        });
                        await _context.SaveChangesAsync(ct);
                    }
                }

                await transaction.CommitAsync(ct);
            }
            catch
            {
                try
                {
                    await transaction.RollbackAsync(ct);
                }
                catch (Exception rollbackEx)
                {
                    _logger.LogWarning(rollbackEx, "Error al revertir la transacción de actualización de personal");
                }

                throw;
            }

            if (enviarCredenciales && dto.AccesoSistema is not null)
            {
                var enviado = await TryEnviarCredencialesAsync(
                    accessEmail, personal.PrimerNombre, accessUsername, dto.AccesoSistema.Password, cuentaNueva, ct);
                if (!enviado)
                {
                    _logger.LogWarning("No se enviaron las credenciales al actualizar el acceso de {Username}", accessUsername);
                }
            }

            return await GetByIdAsync(id, ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("username") == true)
        {
            _logger.LogWarning(ex, "Nombre de usuario duplicado al actualizar personal");
            return ServiceResult<PersonalResponseDto>.Conflict("El nombre de usuario ya existe.");
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
            if (usuario != null)
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

    public async Task<ServiceResult> ActualizarAccesoSistemaAsync(Guid personalId, string username, string password, string? email, int rolId, CancellationToken ct = default)
    {
        try
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.PersonalId == personalId, ct);
            if (usuario is null)
            {
                return ServiceResult.NotFound("Usuario no encontrado.");
            }

            if (!string.IsNullOrWhiteSpace(username))
            {
                var usuarioExiste = await _context.Usuarios.AnyAsync(u => u.Username.ToLower() == username.ToLower() && u.UsuarioId != usuario.UsuarioId, ct);
                if (usuarioExiste)
                {
                    return ServiceResult.Conflict("El nombre de usuario ya existe.");
                }

                usuario.Username = username.ToLower();
            }

            if (!string.IsNullOrWhiteSpace(email))
            {
                if (!EsEmailValido(email))
                {
                    return ServiceResult.BadRequest("El correo electrónico no es válido.");
                }

                var emailNormalizado = email.Trim().ToLowerInvariant();
                var emailExiste = await _context.Usuarios.AnyAsync(
                    u => u.Email != null && u.Email.ToLower() == emailNormalizado && u.UsuarioId != usuario.UsuarioId, ct);
                if (emailExiste)
                {
                    return ServiceResult.Conflict("El correo electrónico ya está registrado.");
                }

                usuario.Email = emailNormalizado;
            }

            var passwordCambiada = !string.IsNullOrWhiteSpace(password);

            if (passwordCambiada)
            {
                if (password.Length < 8)
                {
                    return ServiceResult.BadRequest("La contraseña debe tener al menos 8 caracteres.");
                }

                usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
                usuario.DebeCambiarContrasena = true;
            }

            usuario.UpdatedAt = DateTime.UtcNow;

            if (rolId > 0)
            {
                var rolExiste = await _context.Roles.AnyAsync(r => r.RolId == rolId, ct);
                if (!rolExiste)
                {
                    return ServiceResult.BadRequest("El rol seleccionado no existe.");
                }

                var rolesActuales = await _context.UsuarioRoles.Where(ur => ur.UsuarioId == usuario.UsuarioId).ToListAsync(ct);
                _context.UsuarioRoles.RemoveRange(rolesActuales);
                _context.UsuarioRoles.Add(new UsuarioRol { UsuarioId = usuario.UsuarioId, RolId = rolId });
            }

            await _context.SaveChangesAsync(ct);

            if (passwordCambiada)
            {
                var primerNombre = await _context.Personal
                    .AsNoTracking()
                    .Where(p => p.PersonalId == personalId)
                    .Select(p => p.PrimerNombre)
                    .FirstOrDefaultAsync(ct);

                var enviado = await TryEnviarCredencialesAsync(
                    usuario.Email, primerNombre, usuario.Username, password, esCuentaNueva: false, ct);
                if (!enviado)
                {
                    _logger.LogWarning("No se enviaron las credenciales al actualizar el acceso de {Username}", usuario.Username);
                }
            }

            return ServiceResult.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar el acceso al sistema del personal {Id}", personalId);
            return ServiceResult.Internal("Error al actualizar el acceso al sistema.");
        }
    }

    public async Task<ServiceResult> ReenviarCredencialesAsync(Guid personalId, CancellationToken ct = default)
    {
        try
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.PersonalId == personalId, ct);
            if (usuario is null)
            {
                return ServiceResult.NotFound("El miembro no tiene una cuenta de acceso al sistema.");
            }

            if (string.IsNullOrWhiteSpace(usuario.Email))
            {
                return ServiceResult.BadRequest("El usuario no tiene un correo electrónico registrado.");
            }

            var primerNombre = await _context.Personal
                .AsNoTracking()
                .Where(p => p.PersonalId == personalId)
                .Select(p => p.PrimerNombre)
                .FirstOrDefaultAsync(ct);

            var contrasenaTemporal = GenerarContrasenaTemporal();
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(contrasenaTemporal);

            using var transaction = await _context.Database.BeginTransactionAsync(ct);

            try
            {
                usuario.PasswordHash = passwordHash;
                usuario.DebeCambiarContrasena = true;
                usuario.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(ct);

                var enviado = await _emailService.EnviarCredencialesAsync(
                    usuario.Email, primerNombre ?? usuario.Username, usuario.Username, contrasenaTemporal, esCuentaNueva: false, ct);

                if (!enviado)
                {
                    await transaction.RollbackAsync(ct);
                    return ServiceResult.Internal("No se pudo enviar el correo. Verifica la configuración de Brevo e intenta de nuevo.");
                }

                await transaction.CommitAsync(ct);
                return ServiceResult.Success();
            }
            catch
            {
                try
                {
                    await transaction.RollbackAsync(ct);
                }
                catch (Exception rollbackEx)
                {
                    _logger.LogWarning(rollbackEx, "Error al revertir el reenvío de credenciales de {Id}", personalId);
                }

                throw;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al reenviar las credenciales del personal {Id}", personalId);
            return ServiceResult.Internal("Error al reenviar las credenciales.");
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

    private async Task<Dictionary<Guid, string>> ObtenerRolesPorPersonalAsync(List<Guid> ids, CancellationToken ct)
    {
        if (ids.Count == 0) return new Dictionary<Guid, string>();
        var roles = await _context.UsuarioRoles
            .AsNoTracking()
            .Where(ur => ur.Usuario.PersonalId.HasValue && ids.Contains(ur.Usuario.PersonalId.Value))
            .Select(ur => new { ur.Usuario.PersonalId, ur.Rol.Nombre })
            .ToListAsync(ct);
        return roles.ToDictionary(r => r.PersonalId!.Value, r => r.Nombre);
    }

    private static string BuildNombreCompleto(Personal p)
    {
        var partes = new[] { p.PrimerNombre, p.SegundoNombre, p.PrimerApellido, p.SegundoApellido }
            .Where(n => !string.IsNullOrWhiteSpace(n));
        return string.Join(' ', partes);
    }

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string GenerarContrasenaTemporal()
    {
        const string caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        var resultado = new char[12];
        for (var i = 0; i < resultado.Length; i++)
        {
            resultado[i] = caracteres[RandomNumberGenerator.GetInt32(caracteres.Length)];
        }

        return new string(resultado);
    }

    private async Task<bool> TryEnviarCredencialesAsync(
        string? correo, string? primerNombre, string? username, string? password, bool esCuentaNueva, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(correo) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            return false;
        }

        try
        {
            return await _emailService.EnviarCredencialesAsync(
                correo, primerNombre ?? username, username, password, esCuentaNueva, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "No se pudieron enviar las credenciales de acceso a {Correo}", correo);
            return false;
        }
    }

    private static PersonalResponseDto MapResponse(Personal p, Usuario? usuario)
    {
        var rolPrincipal = usuario?.UsuarioRoles.FirstOrDefault();

        return new PersonalResponseDto
        {
            PersonalId = p.PersonalId,
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
                    Email = usuario.Email,
                    Estado = usuario.Estado,
                    RolId = rolPrincipal?.RolId,
                    Rol = rolPrincipal?.Rol?.Nombre
                }
        };
    }

    [GeneratedRegex(DpiPattern)]
    private static partial Regex DpiRegex();

    private static bool EsEmailValido(string email) =>
        MailAddress.TryCreate(email, out _);
}
