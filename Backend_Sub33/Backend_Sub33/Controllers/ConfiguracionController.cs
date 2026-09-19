using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
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
        private readonly ILogger<ConfiguracionController> _logger;

        public ConfiguracionController(IConfiguracionService service, AppDbContext context, ILogger<ConfiguracionController> logger)
        {
            _service = service;
            _context = context;
            _logger = logger;
        }

        [HttpGet("listas")]
        public async Task<IActionResult> GetListas()
        {
            try
            {
                var listas = await _service.GetAllListasAsync();
                _logger.LogInformation("Listas maestras obtenidas exitosamente. Cantidad: {Count}", listas.Count);
                return Ok(listas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener todas las listas maestras");
                return StatusCode(500, new { mensaje = "Error al obtener las listas", detalle = ex.Message });
            }
        }

        [HttpGet("listas/categoria/{categoriaId:int}")]
        public async Task<IActionResult> GetListasPorCategoria(int categoriaId)
        {
            try
            {
                var listas = await _service.GetPorCategoriaAsync(categoriaId);
                _logger.LogInformation("Listas por categoría '{CategoriaId}' obtenidas. Cantidad: {Count}", categoriaId, listas.Count);
                return Ok(listas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener listas por categoría: {CategoriaId}", categoriaId);
                return StatusCode(500, new { mensaje = "Error al obtener las listas por categoría", detalle = ex.Message });
            }
        }

        [HttpGet("categorias")]
        public async Task<IActionResult> GetCategorias()
        {
            try
            {
                var categorias = await _service.GetCategoriasAsync();
                _logger.LogInformation("Categorías obtenidas exitosamente. Cantidad: {Count}", categorias.Count);
                return Ok(categorias);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener categorías");
                return StatusCode(500, new { mensaje = "Error al obtener categorías", detalle = ex.Message });
            }
        }

        [HttpPost("listas")]
        public async Task<IActionResult> CrearLista(CreateListaMaestraDto dto)
        {
            try
            {
                var resultado = await _service.CrearListaAsync(dto);

                if (resultado.exito)
                {
                    if (resultado.item != null && resultado.mensaje.Contains("ya existe"))
                    {
                        _logger.LogInformation("Opción ya existente: CategoriaId={CategoriaId}, Opcion={Opcion}", resultado.item.CategoriaId, resultado.item.Opcion);
                        return Ok(new { mensaje = resultado.mensaje, item = resultado.item });
                    }

                    _logger.LogInformation("Lista creada: CategoriaId={CategoriaId}, ListaId={ListaId}, Opcion={Opcion}", 
                        resultado.item?.CategoriaId, resultado.item?.ListaId, dto.Opcion);
                    return CreatedAtAction(nameof(GetListas), new { id = resultado.item?.ListaId }, new { mensaje = resultado.mensaje, item = resultado.item });
                }

                _logger.LogWarning("Error al crear lista: {Mensaje}", resultado.mensaje);
                return BadRequest(new { mensaje = resultado.mensaje });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Argumento inválido al crear lista");
                return BadRequest(new { mensaje = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en base de datos al crear lista: CategoriaId={CategoriaId}, Categoria={Categoria}, Opcion={Opcion}", dto.CategoriaId, dto.Categoria, dto.Opcion);
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
                        _logger.LogWarning("Intento de actualizar elemento inexistente: Id={Id}", id);
                        return NotFound(new { mensaje = "El elemento no existe." });
                    }
                    _logger.LogInformation("Elemento actualizado: Id={Id}, Opcion={Opcion}", id, dto.Opcion.Trim());
                    return Ok(new { mensaje = "Elemento actualizado correctamente" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error interno al actualizar elemento: Id={Id}", id);
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
                    _logger.LogWarning("Intento de actualizar opción inexistente: ListaId={ListaId}", listaId);
                    return NotFound(new { mensaje = $"No se encontró el registro con listaId {listaId}" });
                }

                _logger.LogInformation("Opción actualizada: ListaId={ListaId}, Opcion={Opcion}", listaId, dto.Opcion.Trim());
                return Ok(new { mensaje = "Opción actualizada correctamente", listaId, opcion = dto.Opcion.Trim() });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en el servidor al actualizar opción: ListaId={ListaId}", listaId);
                return StatusCode(500, new { mensaje = "Error en el servidor", detalle = ex.Message });
            }
        }

        [HttpDelete("listas/{id:int}")]
        public async Task<IActionResult> EliminarLista(int id)
        {
            try
            {
                await _service.DeleteListaAsync(id);
                _logger.LogInformation("Lista eliminada: Id={Id}", id);
                return Ok(new { exito = true, mensaje = "Lista eliminada correctamente" });
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning("Intento de eliminar lista inexistente: Id={Id}", id);
                return NotFound(new { exito = false, mensaje = "Lista no encontrada" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar la lista: Id={Id}", id);
                return StatusCode(500, new { mensaje = "Error al eliminar la lista", detalle = ex.Message });
            }
        }

        [HttpDelete("listas/categoria/{categoriaId:int}")]
        public async Task<IActionResult> EliminarPorCategoria(int categoriaId)
        {
            try
            {
                var sql = "DELETE FROM configuracion_listas_maestras WHERE categoria_id = @categoriaId";
                var filasEliminadas = await _context.Database.ExecuteSqlRawAsync(
                    sql,
                    new Npgsql.NpgsqlParameter("@categoriaId", categoriaId)
                );

                if (filasEliminadas == 0)
                {
                    _logger.LogWarning("Intento de eliminar categoría inexistente: CategoriaId={CategoriaId}", categoriaId);
                    return NotFound(new { mensaje = $"No se encontró la categoría con ID {categoriaId}" });
                }

                _logger.LogInformation("Categoría eliminada: CategoriaId={CategoriaId}, Eliminados={Count}", categoriaId, filasEliminadas);
                return Ok(new { mensaje = "Categoría eliminada", eliminados = filasEliminadas });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar la categoría: CategoriaId={CategoriaId}", categoriaId);
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
                    .OrderBy(r => r.nombre)
                    .ToListAsync();

                _logger.LogInformation("Rangos obtenidos exitosamente. Cantidad: {Count}", rangos.Count);
                return Ok(rangos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener rangos");
                return StatusCode(500, new { mensaje = ex.Message, detalle = ex.InnerException?.Message });
            }
        }

        [HttpGet("hospitales")]
        public async Task<IActionResult> GetHospitales()
        {
            try
            {
                var hospitales = await _service.GetHospitalesAsync();
                _logger.LogInformation("Hospitales obtenidos exitosamente. Cantidad: {Count}", hospitales.Count);
                return Ok(hospitales);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener hospitales");
                return StatusCode(500, new { mensaje = "Error al obtener hospitales", detalle = ex.Message });
            }
        }

        [HttpGet("tipos-emergencia")]
        public async Task<IActionResult> GetTiposEmergencia()
        {
            try
            {
                var tipos = await _service.GetTiposEmergenciaAsync();
                _logger.LogInformation("Tipos de emergencia obtenidos exitosamente. Cantidad: {Count}", tipos.Count);
                return Ok(tipos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener tipos de emergencia");
                return StatusCode(500, new { mensaje = "Error al obtener tipos de emergencia", detalle = ex.Message });
            }
        }
    }
}

public class UpdateListaDto
{
    public string Opcion { get; set; } = string.Empty;
}