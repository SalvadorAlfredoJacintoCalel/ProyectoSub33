using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend_Sub33.Data;
using Backend_Sub33.Models;
using Backend_Sub33.Models.Entities;
using Backend_Sub33.DTOs;
using BCrypt.Net;

namespace Backend_Sub33.Controllers
{
    [ApiController]
    [Route("api/personal")]
    public class PersonalController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PersonalController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos([FromQuery] bool soloActivos = false)
        {
            try
            {
                var query = _context.Personal.AsQueryable();

                if (soloActivos)
                {
                    query = query.Where(p => p.Estado);
                }

                var personalList = await query
                    .Include(p => p.Rango)
                    .OrderBy(p => p.PrimerApellido)
                    .ThenBy(p => p.PrimerNombre)
                    .ToListAsync();

                var personalIds = personalList.Select(p => p.PersonalId).ToList();

                var usuarios = await _context.Usuarios
                    .Where(u => u.PersonalId.HasValue && personalIds.Contains(u.PersonalId.Value))
                    .Include(u => u.UsuarioRoles)
                    .ThenInclude(ur => ur.Rol)
                    .ToListAsync();

                var usuarioPorPersonal = usuarios
                    .GroupBy(u => u.PersonalId!.Value)
                    .ToDictionary(g => g.Key, g => g.First());

                var lista = personalList.Select(p =>
                {
                    var nombreCompleto = $"{p.PrimerNombre} {p.SegundoNombre} {p.PrimerApellido} {p.SegundoApellido}".Trim();

                    string? username = null;
                    int? rolId = null;
                    string? rol = null;

                    if (usuarioPorPersonal.TryGetValue(p.PersonalId, out var usuario))
                    {
                        username = usuario.Username;
                        var rolPrincipal = usuario.UsuarioRoles.FirstOrDefault();
                        if (rolPrincipal != null)
                        {
                            rolId = rolPrincipal.RolId;
                            rol = rolPrincipal.Rol?.Nombre;
                        }
                    }

                    return new PersonalListDto
                    {
                        Id = p.PersonalId.ToString(),
                        Codigo = string.Empty,
                        Nombre = nombreCompleto,
                        Dpi = p.Dpi,
                        RangoId = p.RangoId,
                        Rango = p.Rango?.Rango,
                        Estado = p.Estado ? "Activo" : "Inactivo",
                        Telefono = p.Telefono,
                        ContactoEmergencia = p.ContactoEmergenciaNombre ?? string.Empty,
                        TelEmergencia = p.ContactoEmergenciaTelefono ?? string.Empty,
                        FechaIngreso = p.FechaIngreso.ToString("yyyy-MM-dd"),
                        Usuario = username,
                        RolId = rolId,
                        Rol = rol
                    };
                }).ToList();

                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = ex.Message, detalle = ex.InnerException?.Message });
            }
        }

        [HttpGet("rangos")]
        public async Task<IActionResult> ObtenerRangos()
        {
            try
            {
                var rangos = await _context.CatRangos
                    .AsNoTracking()
                    .OrderBy(r => r.Rango)
                    .Select(r => new { id = r.RangoId, nombre = r.Rango })
                    .ToListAsync();

                return Ok(rangos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = ex.Message, detalle = ex.InnerException?.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPorId(Guid id)
        {
            try
            {
                var personal = await _context.Personal
                    .Include(p => p.Rango)
                    .FirstOrDefaultAsync(p => p.PersonalId == id);

                if (personal == null)
                {
                    return NotFound(new { mensaje = "Personal no encontrado" });
                }

                var usuario = await _context.Usuarios
                    .Include(u => u.UsuarioRoles)
                    .ThenInclude(ur => ur.Rol)
                    .FirstOrDefaultAsync(u => u.PersonalId == id);

                var dto = new PersonalDto
                {
                    PersonalId = personal.PersonalId,
                    PrimerNombre = personal.PrimerNombre,
                    SegundoNombre = personal.SegundoNombre,
                    PrimerApellido = personal.PrimerApellido,
                    SegundoApellido = personal.SegundoApellido,
                    Dpi = personal.Dpi,
                    FechaNacimiento = personal.FechaNacimiento,
                    RangoId = personal.RangoId,
                    RangoNombre = personal.Rango?.Rango,
                    FechaIngreso = personal.FechaIngreso,
                    Telefono = personal.Telefono,
                    Estado = personal.Estado,
                    ContactoEmergenciaNombre = personal.ContactoEmergenciaNombre,
                    ContactoEmergenciaTelefono = personal.ContactoEmergenciaTelefono,
                    Usuario = usuario != null ? new UsuarioDto
                    {
                        UsuarioId = usuario.UsuarioId,
                        Username = usuario.Username,
                        Estado = usuario.Estado,
                        UltimoLogin = usuario.UltimoLogin,
                        CreatedAt = usuario.CreatedAt,
                        Roles = usuario.UsuarioRoles.Select(ur => new RolDto
                        {
                            RolId = ur.Rol.RolId,
                            Nombre = ur.Rol.Nombre,
                            Descripcion = ur.Rol.Descripcion
                        }).ToList()
                    } : null
                };

                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = ex.Message, detalle = ex.InnerException?.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearPersonalDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var dpiExiste = await _context.Personal.AnyAsync(p => p.Dpi == dto.Dpi);
                if (dpiExiste)
                {
                    return Conflict(new { mensaje = "El DPI ya está registrado" });
                }

                if (dto.AccesoSistema != null)
                {
                    var userExiste = await _context.Usuarios.AnyAsync(u => u.Username == dto.AccesoSistema.Username.ToLower());
                    if (userExiste)
                    {
                        return Conflict(new { mensaje = "El nombre de usuario ya está en uso" });
                    }

                    var rolExiste = await _context.Roles.AnyAsync(r => r.RolId == dto.AccesoSistema.RolId);
                    if (!rolExiste)
                    {
                        return BadRequest(new { mensaje = "El rol seleccionado no existe" });
                    }
                }

                if (dto.RangoId > 0)
                {
                    var rangoExiste = await _context.CatRangos.AnyAsync(r => r.RangoId == dto.RangoId);
                    if (!rangoExiste)
                    {
                        return BadRequest(new { mensaje = "El rango seleccionado no existe" });
                    }
                }
                else
                {
                    return BadRequest(new { mensaje = "El rango es obligatorio" });
                }

                using var transaction = await _context.Database.BeginTransactionAsync();

                var personal = new Personal
                {
                    PersonalId = Guid.NewGuid(),
                    PrimerNombre = dto.PrimerNombre.Trim(),
                    SegundoNombre = dto.SegundoNombre?.Trim(),
                    PrimerApellido = dto.PrimerApellido.Trim(),
                    SegundoApellido = dto.SegundoApellido?.Trim(),
                    Dpi = dto.Dpi.Trim(),
                    FechaNacimiento = dto.FechaNacimiento,
                    RangoId = dto.RangoId,
                    FechaIngreso = dto.FechaIngreso ?? DateTime.Today,
                    Telefono = dto.Telefono.Trim(),
                    Estado = dto.Estado,
                    ContactoEmergenciaNombre = dto.ContactoEmergenciaNombre.Trim(),
                    ContactoEmergenciaTelefono = dto.ContactoEmergenciaTelefono.Trim()
                };

                _context.Personal.Add(personal);
                await _context.SaveChangesAsync();

                Usuario? usuario = null;
                if (dto.AccesoSistema != null)
                {
                    var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.AccesoSistema.Password);

                    usuario = new Usuario
                    {
                        UsuarioId = Guid.NewGuid(),
                        PersonalId = personal.PersonalId,
                        Username = dto.AccesoSistema.Username.Trim().ToLower(),
                        PasswordHash = passwordHash,
                        Estado = dto.Estado,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Usuarios.Add(usuario);
                    await _context.SaveChangesAsync();

                    _context.UsuarioRoles.Add(new UsuarioRol
                    {
                        UsuarioId = usuario.UsuarioId,
                        RolId = dto.AccesoSistema.RolId
                    });
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                var resultado = new PersonalDto
                {
                    PersonalId = personal.PersonalId,
                    PrimerNombre = personal.PrimerNombre,
                    SegundoNombre = personal.SegundoNombre,
                    PrimerApellido = personal.PrimerApellido,
                    SegundoApellido = personal.SegundoApellido,
                    Dpi = personal.Dpi,
                    FechaNacimiento = personal.FechaNacimiento,
                    RangoId = personal.RangoId,
                    RangoNombre = personal.Rango?.Rango,
                    FechaIngreso = personal.FechaIngreso,
                    Telefono = personal.Telefono,
                    Estado = personal.Estado,
                    ContactoEmergenciaNombre = personal.ContactoEmergenciaNombre,
                    ContactoEmergenciaTelefono = personal.ContactoEmergenciaTelefono,
                    Usuario = usuario != null ? new UsuarioDto
                    {
                        UsuarioId = usuario.UsuarioId,
                        Username = usuario.Username,
                        Estado = usuario.Estado,
                        UltimoLogin = usuario.UltimoLogin,
                        CreatedAt = usuario.CreatedAt,
                        Roles = new List<RolDto>()
                    } : null
                };

                return Created($"/api/personal/{personal.PersonalId}", resultado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = ex.Message, detalle = ex.InnerException?.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Actualizar(Guid id, [FromBody] ActualizarPersonalDto dto)
        {
            try
            {
                var personal = await _context.Personal.FindAsync(id);
                if (personal == null)
                {
                    return NotFound(new { mensaje = "Personal no encontrado" });
                }

                if (!string.IsNullOrWhiteSpace(dto.Dpi) && dto.Dpi != personal.Dpi)
                {
                    if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Dpi, @"^\d{13}$"))
                    {
                        return BadRequest(new { mensaje = "El DPI debe ser una cadena numérica de 13 dígitos" });
                    }
                    var dpiExiste = await _context.Personal.AnyAsync(p => p.Dpi == dto.Dpi && p.PersonalId != id);
                    if (dpiExiste)
                    {
                        return Conflict(new { mensaje = "El DPI ya está registrado" });
                    }
                    personal.Dpi = dto.Dpi.Trim();
                }

                if (dto.RangoId.HasValue)
                {
                    var rangoExiste = await _context.CatRangos.AnyAsync(r => r.RangoId == dto.RangoId.Value);
                    if (!rangoExiste)
                    {
                        return BadRequest(new { mensaje = "El rango seleccionado no existe" });
                    }
                    personal.RangoId = dto.RangoId.Value;
                }

                if (!string.IsNullOrWhiteSpace(dto.PrimerNombre)) personal.PrimerNombre = dto.PrimerNombre.Trim();
                if (dto.SegundoNombre != null) personal.SegundoNombre = dto.SegundoNombre.Trim();
                if (!string.IsNullOrWhiteSpace(dto.PrimerApellido)) personal.PrimerApellido = dto.PrimerApellido.Trim();
                if (dto.SegundoApellido != null) personal.SegundoApellido = dto.SegundoApellido.Trim();
                if (dto.FechaNacimiento.HasValue) personal.FechaNacimiento = dto.FechaNacimiento.Value;
                if (dto.FechaIngreso.HasValue) personal.FechaIngreso = dto.FechaIngreso.Value;
                if (!string.IsNullOrWhiteSpace(dto.Telefono)) personal.Telefono = dto.Telefono.Trim();
                if (dto.Estado.HasValue) personal.Estado = dto.Estado.Value;
                if (dto.ContactoEmergenciaNombre != null) personal.ContactoEmergenciaNombre = dto.ContactoEmergenciaNombre.Trim();
                if (dto.ContactoEmergenciaTelefono != null) personal.ContactoEmergenciaTelefono = dto.ContactoEmergenciaTelefono.Trim();

                if (dto.AccesoSistema != null)
                {
                    var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.PersonalId == id);

                    if (usuario == null)
                    {
                        var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.AccesoSistema.Password);
                        usuario = new Usuario
                        {
                            UsuarioId = Guid.NewGuid(),
                            PersonalId = personal.PersonalId,
                            Username = dto.AccesoSistema.Username.Trim().ToLower(),
                            PasswordHash = passwordHash,
                            Estado = personal.Estado,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        _context.Usuarios.Add(usuario);
                        await _context.SaveChangesAsync();

                        _context.UsuarioRoles.Add(new UsuarioRol
                        {
                            UsuarioId = usuario.UsuarioId,
                            RolId = dto.AccesoSistema.RolId
                        });
                    }
                    else
                    {
                        if (!string.IsNullOrWhiteSpace(dto.AccesoSistema.Username) && dto.AccesoSistema.Username != usuario.Username)
                        {
                            var userExiste = await _context.Usuarios.AnyAsync(u => u.Username == dto.AccesoSistema.Username.ToLower() && u.UsuarioId != usuario.UsuarioId);
                            if (userExiste)
                            {
                                return Conflict(new { mensaje = "El nombre de usuario ya está en uso" });
                            }
                            usuario.Username = dto.AccesoSistema.Username.Trim().ToLower();
                        }

                        if (!string.IsNullOrWhiteSpace(dto.AccesoSistema.Password))
                        {
                            usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.AccesoSistema.Password);
                        }

                        usuario.Estado = personal.Estado;
                        usuario.UpdatedAt = DateTime.UtcNow;

                        var rolActual = await _context.UsuarioRoles.FirstOrDefaultAsync(ur => ur.UsuarioId == usuario.UsuarioId);
                        if (rolActual != null && rolActual.RolId != dto.AccesoSistema.RolId)
                        {
                            _context.UsuarioRoles.Remove(rolActual);
                            _context.UsuarioRoles.Add(new UsuarioRol
                            {
                                UsuarioId = usuario.UsuarioId,
                                RolId = dto.AccesoSistema.RolId
                            });
                        }
                        else if (rolActual == null)
                        {
                            _context.UsuarioRoles.Add(new UsuarioRol
                            {
                                UsuarioId = usuario.UsuarioId,
                                RolId = dto.AccesoSistema.RolId
                            });
                        }
                    }
                }

                await _context.SaveChangesAsync();

                var personalActualizado = await _context.Personal
                    .Include(p => p.Rango)
                    .FirstOrDefaultAsync(p => p.PersonalId == id);

                var usuarioActualizado = await _context.Usuarios
                    .Include(u => u.UsuarioRoles)
                    .ThenInclude(ur => ur.Rol)
                    .FirstOrDefaultAsync(u => u.PersonalId == id);

                var resultado = new PersonalDto
                {
                    PersonalId = personalActualizado!.PersonalId,
                    PrimerNombre = personalActualizado.PrimerNombre,
                    SegundoNombre = personalActualizado.SegundoNombre,
                    PrimerApellido = personalActualizado.PrimerApellido,
                    SegundoApellido = personalActualizado.SegundoApellido,
                    Dpi = personalActualizado.Dpi,
                    FechaNacimiento = personalActualizado.FechaNacimiento,
                    RangoId = personalActualizado.RangoId,
                    RangoNombre = personalActualizado.Rango?.Rango,
                    FechaIngreso = personalActualizado.FechaIngreso,
                    Telefono = personalActualizado.Telefono,
                    Estado = personalActualizado.Estado,
                    ContactoEmergenciaNombre = personalActualizado.ContactoEmergenciaNombre,
                    ContactoEmergenciaTelefono = personalActualizado.ContactoEmergenciaTelefono,
                    Usuario = usuarioActualizado != null ? new UsuarioDto
                    {
                        UsuarioId = usuarioActualizado.UsuarioId,
                        Username = usuarioActualizado.Username,
                        Estado = usuarioActualizado.Estado,
                        UltimoLogin = usuarioActualizado.UltimoLogin,
                        CreatedAt = usuarioActualizado.CreatedAt,
                        Roles = usuarioActualizado.UsuarioRoles.Select(ur => new RolDto
                        {
                            RolId = ur.Rol.RolId,
                            Nombre = ur.Rol.Nombre,
                            Descripcion = ur.Rol.Descripcion
                        }).ToList()
                    } : null
                };

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = ex.Message, detalle = ex.InnerException?.Message });
            }
        }

        [HttpPatch("{id}/estado")]
        public async Task<IActionResult> CambiarEstado(Guid id, [FromBody] CambiarEstadoDto dto)
        {
            try
            {
                var personal = await _context.Personal.FindAsync(id);
                if (personal == null)
                {
                    return NotFound(new { mensaje = "Personal no encontrado" });
                }

                personal.Estado = dto.Estado;

                var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.PersonalId == id);
                if (usuario != null)
                {
                    usuario.Estado = dto.Estado;
                    usuario.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new { mensaje = $"Estado actualizado a {(dto.Estado ? "Activo" : "Inactivo")}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = ex.Message, detalle = ex.InnerException?.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(Guid id)
        {
            try
            {
                var personal = await _context.Personal.FindAsync(id);
                if (personal == null)
                {
                    return NotFound(new { mensaje = "Personal no encontrado" });
                }

                // Soft delete: marcar como inactivo en lugar de eliminar físicamente
                personal.Estado = false;

                var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.PersonalId == id);
                if (usuario != null)
                {
                    usuario.Estado = false;
                    usuario.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Personal desactivado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = ex.Message, detalle = ex.InnerException?.Message });
            }
        }
    }
}