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

    // ── Módulos asignados al usuario autenticado (para filtrar sidebar) ─────────
    [Authorize]
    [HttpGet("permisos/mios")]
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

    // ── Listar módulos por usuario (incluye flag de asignado) ───────────────────
    [HttpGet("permisos/usuario/{usuarioId:guid}")]
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

    // ── Asignar módulos a un usuario (reemplaza sus módulos explícitos) ──────────
    [HttpPost("permisos/usuario/asignar")]
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
    [HttpGet("permisos/listar/{rolId:int}")]
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
    [HttpPost("permisos/asignar")]
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
}
