using Backend_Sub33.DTOs.Configuracion;
using Backend_Sub33.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend_Sub33.Controllers
{
    [ApiController]
    [Route("api/configuracion")]
    public class ConfiguracionController : ControllerBase
    {
        private readonly IConfiguracionService _service;

        public ConfiguracionController(IConfiguracionService service)
        {
            _service = service;
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
                var creado = await _service.CrearListaAsync(dto.Categoria, dto.Opcion);
                if (creado)
                {
                    return Ok(new { mensaje = "Registro creado con éxito" });
                }
                return BadRequest(new { mensaje = "No se pudo crear el registro" });
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
        public async Task<IActionResult> ActualizarLista(int id, UpdateListaMaestraDto dto)
        {
            try
            {
                await _service.UpdateListaAsync(id, dto);
                return Ok(new { exito = true, mensaje = "Lista actualizada correctamente" });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { exito = false, mensaje = "Lista no encontrada" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al actualizar la lista", detalle = ex.Message });
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

        [HttpGet("rangos")]
        public async Task<IActionResult> GetRangos()
        {
            try
            {
                var rangos = await _service.GetRangosAsync();
                return Ok(rangos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener rangos", detalle = ex.Message });
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
}