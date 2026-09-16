using Microsoft.AspNetCore.Mvc;
using Backend_Sub33.Data;
using Backend_Sub33.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_Sub33.Controllers
{
    [ApiController]
    [Route("api/roles")]
    [Route("api/configuracion/roles")]
    public class RolesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RolesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetRoles([FromQuery] bool soloActivos = true)
        {
            try
            {
                var query = _context.Roles.AsQueryable();

                if (soloActivos)
                {
                    query = query.Where(r => r.Nombre != null);
                }

                var roles = await query
                    .Select(r => new
                    {
                        r.RolId,
                        r.Nombre,
                        r.Descripcion
                    })
                    .OrderBy(r => r.Nombre)
                    .ToListAsync();

                return Ok(roles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener roles", detalle = ex.Message });
            }
        }

        [HttpGet("{rolId}")]
        public async Task<IActionResult> ObtenerPorId(string rolId)
        {
            try
            {
                var rol = await _context.Roles
                    .Where(r => r.RolId == rolId)
                    .Select(r => new
                    {
                        r.RolId,
                        r.Nombre,
                        r.Descripcion
                    })
                    .FirstOrDefaultAsync();

                if (rol == null)
                {
                    return NotFound(new { mensaje = "Rol no encontrado" });
                }

                return Ok(rol);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener rol", detalle = ex.Message });
            }
        }
    }
}