using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs.Seguridad;
using Backend_Sub33.Models;

namespace Backend_Sub33.Controllers;

[ApiController]
[Route("api/seguridad")]
public class SeguridadController : ControllerBase
{
    private readonly AppDbContext _context;

    public SeguridadController(AppDbContext context)
    {
        _context = context;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  MÓDULOS — visibilidad de los módulos en el menú (sidebar)
    // ═══════════════════════════════════════════════════════════════════════

    // ── Módulos asignados al usuario autenticado (para filtrar sidebar) ─────────
    [Authorize]
    [HttpGet("modulos/mios")]
    public async Task<IActionResult> MisModulos()
    {
        var usuarioIdClaim = User.FindFirst("usuario_id")?.Value;
        if (string.IsNullOrEmpty(usuarioIdClaim) || !Guid.TryParse(usuarioIdClaim, out var usuarioId))
        {
            return Unauthorized(new { mensaje = "Usuario no autenticado" });
        }

        // Prioridad: módulos explícitos del usuario (usuario_modulos).
        var usuarioModulos = await _context.UsuarioModulos
            .Where(um => um.UsuarioId == usuarioId)
            .Select(um => um.Modulo.CodigoModulo)
            .ToListAsync();

        if (usuarioModulos.Count > 0)
        {
            return Ok(usuarioModulos);
        }

        // Fallback: módulos heredados de sus roles (rol_modulo).
        var rolModulos = await _context.UsuarioRoles
            .Where(ur => ur.UsuarioId == usuarioId)
            .SelectMany(ur => ur.Rol.RolModulos.Select(rm => rm.Modulo.CodigoModulo))
            .Distinct()
            .ToListAsync();

        return Ok(rolModulos);
    }

    // ── Listar módulos por usuario (incluye flag de asignado) ─────────────────
    [HttpGet("modulos/usuario/{usuarioId:guid}")]
    public async Task<IActionResult> ListarModulosUsuario(Guid usuarioId)
    {
        try
        {
            var modulos = await _context.CatModulos
                .AsNoTracking()
                .OrderBy(m => m.ModuloId)
                .ToListAsync();

            var asignados = await _context.UsuarioModulos
                .Where(um => um.UsuarioId == usuarioId)
                .Select(um => um.ModuloId)
                .ToListAsync();

            var asignadosSet = asignados.ToHashSet();

            var resultado = modulos.Select(m => new
            {
                moduloId = m.ModuloId,
                codigo = m.CodigoModulo,
                nombre = m.NombreModulo,
                descripcion = m.Descripcion,
                asignado = asignadosSet.Contains(m.ModuloId)
            });

            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error al obtener los módulos", detalle = ex.Message });
        }
    }

    // ── Asignar módulos a un usuario (reemplaza sus módulos explícitos) ────────
    [HttpPost("modulos/usuario/asignar")]
    public async Task<IActionResult> AsignarModulosUsuario([FromBody] AsignarModuloUsuarioDto dto)
    {
        if (dto == null || dto.UsuarioId == Guid.Empty)
        {
            return BadRequest(new { mensaje = "El usuario es obligatorio" });
        }

        try
        {
            var usuarioExiste = await _context.Usuarios.AnyAsync(u => u.UsuarioId == dto.UsuarioId);
            if (!usuarioExiste)
            {
                return NotFound(new { mensaje = "El usuario no existe" });
            }

            var existentes = await _context.UsuarioModulos
                .Where(um => um.UsuarioId == dto.UsuarioId)
                .ToListAsync();
            _context.UsuarioModulos.RemoveRange(existentes);

            foreach (var moduloId in (dto.ModuloIds ?? new List<int>()).Distinct())
            {
                _context.UsuarioModulos.Add(new UsuarioModulo { UsuarioId = dto.UsuarioId, ModuloId = moduloId });
            }

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Módulos asignados correctamente" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error al asignar los módulos", detalle = ex.Message });
        }
    }

    // ── Listar módulos por rol (incluye flag de asignado) ───────────────────────
    [HttpGet("modulos/listar/{rolId:int}")]
    public async Task<IActionResult> ListarModulos(int rolId)
    {
        try
        {
            var modulos = await _context.CatModulos
                .AsNoTracking()
                .OrderBy(m => m.ModuloId)
                .ToListAsync();

            var asignados = await _context.RolModulos
                .Where(rm => rm.RolId == rolId)
                .Select(rm => rm.ModuloId)
                .ToListAsync();

            var asignadosSet = asignados.ToHashSet();

            var resultado = modulos.Select(m => new
            {
                moduloId = m.ModuloId,
                codigo = m.CodigoModulo,
                nombre = m.NombreModulo,
                descripcion = m.Descripcion,
                asignado = asignadosSet.Contains(m.ModuloId)
            });

            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error al obtener los módulos", detalle = ex.Message });
        }
    }

    // ── Asignar módulos a un rol ────────────────────────────────────────────────
    [HttpPost("modulos/asignar")]
    public async Task<IActionResult> AsignarModulos([FromBody] AsignarModuloDto dto)
    {
        if (dto == null || dto.RolId <= 0)
        {
            return BadRequest(new { mensaje = "El rol es obligatorio" });
        }

        try
        {
            var rolExiste = await _context.Roles.AnyAsync(r => r.RolId == dto.RolId);
            if (!rolExiste)
            {
                return NotFound(new { mensaje = "El rol no existe" });
            }

            var existentes = await _context.RolModulos
                .Where(rm => rm.RolId == dto.RolId)
                .ToListAsync();
            _context.RolModulos.RemoveRange(existentes);

            foreach (var moduloId in (dto.ModuloIds ?? new List<int>()).Distinct())
            {
                _context.RolModulos.Add(new RolModulo { RolId = dto.RolId, ModuloId = moduloId });
            }

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Módulos asignados correctamente" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error al asignar los módulos", detalle = ex.Message });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PERMISOS — acciones granulares por módulo
    // ═══════════════════════════════════════════════════════════════════════

    // ── Permisos efectivos del usuario autenticado ─────────────────────────────
    [Authorize]
    [HttpGet("permisos/mios")]
    public async Task<IActionResult> MisPermisos()
    {
        var usuarioIdClaim = User.FindFirst("usuario_id")?.Value;
        if (string.IsNullOrEmpty(usuarioIdClaim) || !Guid.TryParse(usuarioIdClaim, out var usuarioId))
        {
            return Unauthorized(new { mensaje = "Usuario no autenticado" });
        }

        // Prioridad: overrides explícitos del usuario (usuario_permisos).
        var usuarioPermisos = await _context.UsuarioPermisos
            .Where(up => up.UsuarioId == usuarioId)
            .Select(up => up.Permiso.Codigo)
            .ToListAsync();

        if (usuarioPermisos.Count > 0)
        {
            return Ok(usuarioPermisos);
        }

        // Fallback: permisos heredados de sus roles (rol_permisos).
        var rolPermisos = await _context.UsuarioRoles
            .Where(ur => ur.UsuarioId == usuarioId)
            .SelectMany(ur => ur.Rol.RolPermisos.Select(rp => rp.Permiso.Codigo))
            .Distinct()
            .ToListAsync();

        return Ok(rolPermisos);
    }

    // ── Listar permisos de un rol (con flag de asignado) ───────────────────────
    [HttpGet("permisos/listar/{rolId:int}")]
    public async Task<IActionResult> ListarPermisos(int rolId)
    {
        try
        {
            var permisos = await _context.Permisos
                .AsNoTracking()
                .Include(p => p.Modulo)
                .OrderBy(p => p.ModuloId)
                .ThenBy(p => p.PermisoId)
                .ToListAsync();

            var asignados = await _context.RolPermisos
                .Where(rp => rp.RolId == rolId)
                .Select(rp => rp.PermisoId)
                .ToListAsync();

            var asignadosSet = asignados.ToHashSet();

            var resultado = permisos.Select(p => new
            {
                permisoId = p.PermisoId,
                moduloId = p.ModuloId,
                moduloCodigo = p.Modulo.CodigoModulo,
                moduloNombre = p.Modulo.NombreModulo,
                codigo = p.Codigo,
                nombre = p.Nombre,
                descripcion = p.Descripcion ?? string.Empty,
                asignado = asignadosSet.Contains(p.PermisoId)
            });

            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error al obtener los permisos", detalle = ex.Message });
        }
    }

    // ── Asignar permisos a un rol (reemplaza los del rol) ─────────────────────
    [HttpPost("permisos/asignar")]
    public async Task<IActionResult> AsignarPermisos([FromBody] AsignarPermisoDto dto)
    {
        if (dto == null || dto.RolId <= 0)
        {
            return BadRequest(new { mensaje = "El rol es obligatorio" });
        }

        try
        {
            var rolExiste = await _context.Roles.AnyAsync(r => r.RolId == dto.RolId);
            if (!rolExiste)
            {
                return NotFound(new { mensaje = "El rol no existe" });
            }

            var existentes = await _context.RolPermisos
                .Where(rp => rp.RolId == dto.RolId)
                .ToListAsync();
            _context.RolPermisos.RemoveRange(existentes);

            foreach (var permisoId in (dto.PermisoIds ?? new List<int>()).Distinct())
            {
                _context.RolPermisos.Add(new RolPermiso { RolId = dto.RolId, PermisoId = permisoId });
            }

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Permisos asignados correctamente" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error al asignar los permisos", detalle = ex.Message });
        }
    }

    // ── Listar permisos efectivos de un usuario (con flag de asignado) ──────────
    [HttpGet("permisos/usuario/{usuarioId:guid}")]
    public async Task<IActionResult> ListarPermisosUsuario(Guid usuarioId)
    {
        try
        {
            var usuarioExiste = await _context.Usuarios.AnyAsync(u => u.UsuarioId == usuarioId);
            if (!usuarioExiste)
            {
                return NotFound(new { mensaje = "El usuario no existe" });
            }

            var permisos = await _context.Permisos
                .AsNoTracking()
                .Include(p => p.Modulo)
                .OrderBy(p => p.ModuloId)
                .ThenBy(p => p.PermisoId)
                .ToListAsync();

            // Overrides explícitos del usuario; si no hay, se heredan del rol.
            var overrides = await _context.UsuarioPermisos
                .Where(up => up.UsuarioId == usuarioId)
                .Select(up => up.PermisoId)
                .ToListAsync();

            HashSet<int> asignados;

            if (overrides.Count > 0)
            {
                asignados = overrides.ToHashSet();
            }
            else
            {
                var delRol = await _context.UsuarioRoles
                    .Where(ur => ur.UsuarioId == usuarioId)
                    .SelectMany(ur => ur.Rol.RolPermisos.Select(rp => rp.PermisoId))
                    .Distinct()
                    .ToListAsync();

                asignados = delRol.ToHashSet();
            }

            var resultado = permisos.Select(p => new
            {
                permisoId = p.PermisoId,
                moduloId = p.ModuloId,
                moduloCodigo = p.Modulo.CodigoModulo,
                moduloNombre = p.Modulo.NombreModulo,
                codigo = p.Codigo,
                nombre = p.Nombre,
                descripcion = p.Descripcion ?? string.Empty,
                asignado = asignados.Contains(p.PermisoId)
            });

            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error al obtener los permisos del usuario", detalle = ex.Message });
        }
    }

    // ── Asignar permisos a un usuario (override; reemplaza los heredados) ───────
    [HttpPost("permisos/usuario/asignar")]
    public async Task<IActionResult> AsignarPermisosUsuario([FromBody] AsignarPermisoUsuarioDto dto)
    {
        if (dto == null || dto.UsuarioId == Guid.Empty)
        {
            return BadRequest(new { mensaje = "El usuario es obligatorio" });
        }

        try
        {
            var usuarioExiste = await _context.Usuarios.AnyAsync(u => u.UsuarioId == dto.UsuarioId);
            if (!usuarioExiste)
            {
                return NotFound(new { mensaje = "El usuario no existe" });
            }

            var existentes = await _context.UsuarioPermisos
                .Where(up => up.UsuarioId == dto.UsuarioId)
                .ToListAsync();
            _context.UsuarioPermisos.RemoveRange(existentes);

            foreach (var permisoId in (dto.PermisoIds ?? new List<int>()).Distinct())
            {
                _context.UsuarioPermisos.Add(new UsuarioPermiso { UsuarioId = dto.UsuarioId, PermisoId = permisoId });
            }

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Permisos asignados correctamente" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error al asignar los permisos", detalle = ex.Message });
        }
    }
}
