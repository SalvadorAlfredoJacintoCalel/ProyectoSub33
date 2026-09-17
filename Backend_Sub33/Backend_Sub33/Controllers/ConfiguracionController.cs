using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend_Sub33.Data;
using Backend_Sub33.Models.Entities;
using Backend_Sub33.DTOs.Configuracion;
using Backend_Sub33.Services;
using Npgsql;

namespace Backend_Sub33.Controllers
{
    [ApiController]
    [Route("api/configuracion")]
    public class ConfiguracionController : ControllerBase
    {
        private readonly IConfiguracionService _service;
        private readonly AppDbContext _context;

        public ConfiguracionController(IConfiguracionService service, AppDbContext context)
        {
            _service = service;
            _context = context;
        }

        [HttpGet("listas")]
        public async Task<IActionResult> GetListas()
        {
            try
            {
                var listas = await _service.GetAllListasAsync();
                return Ok(listas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener las listas", detalle = ex.Message });
            }
        }

        [HttpGet("listas/{categoria}")]
        public async Task<IActionResult> GetListasPorCategoria(string categoria)
        {
            try
            {
                var listas = await _service.GetPorCategoriaAsync(categoria);
                return Ok(listas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener las listas por categoría", detalle = ex.Message });
            }
        }

        [HttpGet("categorias")]
        public async Task<IActionResult> GetCategorias()
        {
            try
            {
                var categorias = await _service.GetCategoriasAsync();
                return Ok(categorias);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener categorías", detalle = ex.Message });
            }
        }

        [HttpPost("listas")]
        public async Task<IActionResult> CrearLista(CreateListaMaestraDto dto)
        {
            try
            {
                var resultado = await _service.CrearListaAsync(dto.Categoria, dto.Opcion);
                if (resultado.exito)
                {
                    return Ok(new { mensaje = resultado.mensaje });
                }
                return BadRequest(new { mensaje = resultado.mensaje });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] CrearListaAsync failed: {ex.ToString()}");
                return StatusCode(500, new { mensaje = "Error en base de datos", detalle = ex.Message });
            }
        }

        [HttpPut("listas/{id}")]
        public async Task<IActionResult> UpdateListaItem(int id, [FromBody] UpdateListaDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Opcion))
            {
                return BadRequest(new { mensaje = "El texto de la opción no puede estar vacío." });
            }
            try
            {
                var conn = _context.Database.GetDbConnection();
                if (conn.State != System.Data.ConnectionState.Open) await conn.OpenAsync();
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = @"
                        UPDATE configuracion_listas_maestras 
                        SET opcion = @opcion 
                        WHERE lista_id = @id;";
                    var pOpcion = cmd.CreateParameter();
                    pOpcion.ParameterName = "@opcion";
                    pOpcion.Value = dto.Opcion.Trim();
                    cmd.Parameters.Add(pOpcion);
                    var pId = cmd.CreateParameter();
                    pId.ParameterName = "@id";
                    pId.Value = id;
                    cmd.Parameters.Add(pId);
                    int filasAfectadas = await cmd.ExecuteNonQueryAsync();
                    if (filasAfectadas == 0)
                    {
                        return NotFound(new { mensaje = "El elemento no existe." });
                    }
                    return Ok(new { mensaje = "Elemento actualizado correctamente" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno al actualizar", detalle = ex.Message });
            }
        }

        [HttpPut("listas/{listaId}/opcion")]
        public async Task<IActionResult> ActualizarOpcion(int listaId, [FromBody] UpdateListaMaestraDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Opcion))
            {
                return BadRequest(new { mensaje = "La opción no puede estar vacía" });
            }

            try
            {
                var sql = "UPDATE configuracion_listas_maestras SET opcion = @opcion WHERE lista_id = @listaId";
                var filasAfectadas = await _context.Database.ExecuteSqlRawAsync(
                    sql,
                    new Npgsql.NpgsqlParameter("@opcion", dto.Opcion.Trim()),
                    new Npgsql.NpgsqlParameter("@listaId", listaId)
                );

                if (filasAfectadas == 0)
                {
                    return NotFound(new { mensaje = $"No se encontró el registro con listaId {listaId}" });
                }

                return Ok(new { mensaje = "Opción actualizada correctamente", listaId, opcion = dto.Opcion.Trim() });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error en el servidor", detalle = ex.Message });
            }
        }

        [HttpDelete("listas/{id:int}")]
        public async Task<IActionResult> EliminarLista(int id)
        {
            try
            {
                await _service.DeleteListaAsync(id);
                return Ok(new { exito = true, mensaje = "Lista eliminada correctamente" });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { exito = false, mensaje = "Lista no encontrada" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al eliminar la lista", detalle = ex.Message });
            }
        }

        [HttpDelete("listas/categoria/{categoria}")]
        public async Task<IActionResult> EliminarCategoria(string categoria)
        {
            if (string.IsNullOrWhiteSpace(categoria))
            {
                return BadRequest(new { mensaje = "La categoría es obligatoria" });
            }

            try
            {
                var sql = "DELETE FROM configuracion_listas_maestras WHERE LOWER(categoria) = LOWER(@categoria)";
                var filasEliminadas = await _context.Database.ExecuteSqlRawAsync(
                    sql,
                    new Npgsql.NpgsqlParameter("@categoria", categoria.Trim())
                );

                if (filasEliminadas == 0)
                {
                    return NotFound(new { mensaje = $"No se encontró la categoría '{categoria}'" });
                }

                return Ok(new { mensaje = "Categoría eliminada", eliminados = filasEliminadas });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al eliminar la categoría", detalle = ex.Message });
            }
        }

        [HttpGet("rangos")]
        public async Task<IActionResult> GetRangos()
        {
            try
            {
                var rangos = await _context.CatRangos
                    .Select(r => new { id = r.RangoId, nombre = r.Rango })
                    .ToListAsync();
                return Ok(rangos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = ex.Message, detalle = ex.InnerException?.Message });
            }
        }

        [HttpGet("hospitales")]
        public async Task<IActionResult> GetHospitales()
        {
            try
            {
                var hospitales = await _service.GetHospitalesAsync();
                return Ok(hospitales);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener hospitales", detalle = ex.Message });
            }
        }

        [HttpGet("tipos-emergencia")]
        public async Task<IActionResult> GetTiposEmergencia()
        {
            try
            {
                var tipos = await _service.GetTiposEmergenciaAsync();
                return Ok(tipos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener tipos de emergencia", detalle = ex.Message });
}
    }
}

public class UpdateListaDto
{
    public string Opcion { get; set; } = string.Empty;
}
}