using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Backend_Sub33.Data;
using Backend_Sub33.Models.Entities;
using Backend_Sub33.DTOs.Configuracion;
using Backend_Sub33.Services;
using System.Threading.Tasks;

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

                if (!resultado.exito)
                {
                    _logger.LogWarning("Error al crear lista: {Mensaje}", resultado.mensaje);
                    return BadRequest(new { mensaje = resultado.mensaje });
                }

                if (resultado.mensaje.Contains("ya existe"))
                {
                    _logger.LogInformation("Opción ya existente: CategoriaId={CategoriaId}, Opcion={Opcion}", resultado.item?.CategoriaId, resultado.item?.Opcion);
                    return Ok(new { mensaje = resultado.mensaje, item = resultado.item });
                }

                _logger.LogInformation("Lista creada: CategoriaId={CategoriaId}, ListaId={ListaId}, Opcion={Opcion}",
                    resultado.item?.CategoriaId, resultado.item?.ListaId, dto.Opcion);

                return CreatedAtAction(nameof(GetListas), new { id = resultado.item?.ListaId }, new { mensaje = resultado.mensaje, item = resultado.item });
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

        [HttpPut("listas/{id:int}")]
        public async Task<IActionResult> ActualizarOpcion(int id, [FromBody] UpdateListaMaestraDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Opcion))
            {
                return BadRequest(new { mensaje = "El texto de la opción no puede estar vacío." });
            }

            try
            {
                await _service.UpdateListaAsync(id, dto);
                _logger.LogInformation("Opción actualizada: Id={Id}, Opcion={Opcion}", id, dto.Opcion.Trim());
                return Ok(new { mensaje = "Opción actualizada correctamente", id, opcion = dto.Opcion.Trim() });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Argumento inválido al actualizar opción");
                return BadRequest(new { mensaje = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Opción duplicada al actualizar");
                return BadRequest(new { mensaje = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Opción no encontrada para actualizar: Id={Id}", id);
                return NotFound(new { mensaje = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error interno al actualizar opción: Id={Id}", id);
                return StatusCode(500, new { mensaje = "Error interno al actualizar", detalle = ex.Message });
            }
        }

        [HttpPut("categorias/{id:int}")]
        public async Task<IActionResult> UpdateCategoria(int id, [FromBody] UpdateCategoriaDto dto)
        {
            try
            {
                await _service.UpdateCategoriaAsync(id, dto);
                _logger.LogInformation("Categoría actualizada: Id={Id}, Nombre={Nombre}, Modulo={Modulo}", id, dto.Nombre, dto.Modulo);
                return Ok(new { mensaje = "Categoría actualizada correctamente", id, nombre = dto.Nombre, modulo = dto.Modulo });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Categoría no encontrada para actualizar: Id={Id}", id);
                return NotFound(new { mensaje = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error interno al actualizar categoría: Id={Id}", id);
                return StatusCode(500, new { mensaje = "Error interno al actualizar", detalle = ex.Message });
            }
        }

        [HttpDelete("listas/{id:int}")]
        public async Task<IActionResult> EliminarOpcion(int id)
        {
            try
            {
                await _service.DeleteListaAsync(id);
                _logger.LogInformation("Opción eliminada: Id={Id}", id);
                return Ok(new { exito = true, mensaje = "Opción eliminada correctamente" });
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning("Intento de eliminar opción inexistente: Id={Id}", id);
                return NotFound(new { exito = false, mensaje = "Opción no encontrada" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar la opción: Id={Id}", id);
                return StatusCode(500, new { mensaje = "Error al eliminar la opción", detalle = ex.Message });
            }
        }

        [HttpDelete("categorias/{id:int}")]
        public async Task<IActionResult> EliminarCategoria(int id)
        {
            try
            {
                var categoriaEliminada = await _service.DeleteCategoriaAsync(id);
                _logger.LogInformation("Categoría eliminada: CategoriaId={CategoriaId}", categoriaEliminada.CategoriaId);
                return Ok(new
                {
                    exito = true,
                    mensaje = "Categoría eliminada correctamente",
                    categoria = new
                    {
                        categoria_id = categoriaEliminada.CategoriaId,
                        codigo = categoriaEliminada.Codigo,
                        nombre = categoriaEliminada.Nombre,
                        modulo = categoriaEliminada.Modulo,
                        descripcion = categoriaEliminada.Descripcion
                    }
                });
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning("Intento de eliminar categoría inexistente: Id={Id}", id);
                return NotFound(new { exito = false, mensaje = "Categoría no encontrada" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar la categoría: Id={Id}", id);
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

public class UpdateCategoriaDto
{
    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Modulo { get; set; }
}
