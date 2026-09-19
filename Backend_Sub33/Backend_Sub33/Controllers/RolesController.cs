using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Backend_Sub33.Data;
using Backend_Sub33.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend_Sub33.Controllers
{
    [ApiController]
    [Route("api/roles")]
    [Route("api/configuracion/roles")]
    public class RolesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<RolesController> _logger;

        public RolesController(AppDbContext context, ILogger<RolesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            try
            {
                var sql = @"
                    SELECT clm.lista_id AS id, clm.opcion AS nombre
                    FROM configuracion_listas_maestras clm
                    INNER JOIN cat_categorias_listas ccl ON clm.categoria_id = ccl.categoria_id
                    WHERE ccl.codigo = 'ROLES'
                    ORDER BY clm.opcion";

                var roles = await _context.Database
                    .SqlQueryRaw<dynamic>(sql)
                    .ToListAsync();

                _logger.LogInformation("Roles obtenidos exitosamente. Cantidad: {Count}", roles.Count);
                return Ok(roles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener roles");
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
                    _logger.LogWarning("Rol no encontrado: {RolId}", rolId);
                    return NotFound(new { mensaje = "Rol no encontrado" });
                }

                _logger.LogInformation("Rol obtenido: {RolId}", rolId);
                return Ok(rol);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener rol por ID: {RolId}", rolId);
                return StatusCode(500, new { mensaje = "Error interno al obtener rol", detalle = ex.Message });
            }
        }
    }
}