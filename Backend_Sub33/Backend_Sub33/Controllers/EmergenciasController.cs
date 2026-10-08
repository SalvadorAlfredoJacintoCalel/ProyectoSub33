using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs;
using Backend_Sub33.Services;

namespace Backend_Sub33.Controllers
{
    [ApiController]
    [Route("api/emergencias")]
    public class EmergenciasController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmergenciaService _emergenciaService;

        public EmergenciasController(AppDbContext context, IEmergenciaService emergenciaService)
        {
            _context = context;
            _emergenciaService = emergenciaService;
        }

        [HttpPost]
        public async Task<IActionResult> Registrar([FromBody] EmergenciaCreateDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { exito = false, mensaje = "Datos de emergencia inválidos." });
            }

            try
            {
                var creada = await _emergenciaService.CrearEmergenciaAsync(dto);

                return Ok(new
                {
                    exito = true,
                    mensaje = "Emergencia registrada exitosamente.",
                    servicioId = creada.ServicioId,
                    numeroIncidente = creada.NumeroIncidente
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { exito = false, mensaje = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR EMERGENCIAS]: {ex.Message}");
                if (ex.InnerException != null)
                    Console.WriteLine($"[INNER ERROR]: {ex.InnerException.Message}");

                return StatusCode(500, new
                {
                    exito = false,
                    mensaje = $"Error Backend: {ex.Message}",
                    detalle = ex.InnerException?.Message
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> Listar([FromQuery] string? busqueda = null, [FromQuery] string? unidad = null,
            [FromQuery] string? tipo = null, [FromQuery] string? piloto = null,
            [FromQuery] DateTime? desde = null, [FromQuery] DateTime? hasta = null,
            [FromQuery] string? estado = null, [FromQuery] int pagina = 1, [FromQuery] int tamanoPagina = 10)
        {
            var filtros = new EmergenciaFiltrosDto
            {
                Busqueda = busqueda,
                Unidad = unidad,
                Tipo = tipo,
                Piloto = piloto,
                Desde = desde,
                Hasta = hasta,
                Estado = estado,
                Pagina = Math.Max(1, pagina),
                TamanoPagina = Math.Clamp(tamanoPagina, 1, 100)
            };

            try
            {
                var resultado = await _emergenciaService.ListarEmergenciasAsync(filtros);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR EMERGENCIAS LIST]: {ex.Message}");
                return StatusCode(500, new { exito = false, mensaje = $"Error al obtener emergencias: {ex.Message}" });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> ObtenerPorId(int id)
        {
            try
            {
                var emergencia = await _emergenciaService.ObtenerEmergenciaPorIdAsync(id);
                if (emergencia == null)
                {
                    return NotFound(new { exito = false, mensaje = "Emergencia no encontrada." });
                }

                return Ok(emergencia);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR EMERGENCIAS GET]: {ex.Message}");
                return StatusCode(500, new { exito = false, mensaje = $"Error al obtener emergencia: {ex.Message}" });
            }
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Actualizar(int id, [FromBody] EmergenciaUpdateDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { exito = false, mensaje = "Datos de emergencia inválidos." });
            }

            if (!ModelState.IsValid)
            {
                var errores = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .Where(m => !string.IsNullOrWhiteSpace(m))
                    .ToList();
                return BadRequest(new { exito = false, mensaje = errores.FirstOrDefault() ?? "La solicitud contiene datos inválidos.", errores });
            }

            try
            {
                var actualizada = await _emergenciaService.ActualizarEmergenciaAsync(id, dto);
                if (actualizada == null)
                {
                    return NotFound(new { exito = false, mensaje = "Emergencia no encontrada." });
                }

                return Ok(actualizada);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR EMERGENCIAS PUT]: {ex.Message}");
                return StatusCode(500, new { exito = false, mensaje = $"Error al actualizar emergencia: {ex.Message}" });
            }
        }

        [HttpPatch("{id:int}/estado")]
        public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Estado))
            {
                return BadRequest(new { exito = false, mensaje = "El estado es obligatorio." });
            }

            var estado = dto.Estado;
            if (estado != "Activo" && estado != "Inactivo")
            {
                return BadRequest(new { exito = false, mensaje = "El estado debe ser 'Activo' o 'Inactivo'." });
            }

            try
            {
                var afectado = await _emergenciaService.CambiarEstadoAsync(id, estado);
                if (!afectado)
                {
                    return NotFound(new { exito = false, mensaje = "Emergencia no encontrada." });
                }

                return Ok(new { exito = true, mensaje = "Estado actualizado correctamente.", estado });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR EMERGENCIAS PATCH]: {ex.Message}");
                return StatusCode(500, new { exito = false, mensaje = $"Error al cambiar estado: {ex.Message}" });
            }
        }

        [HttpGet("siguiente-incidente")]
        public async Task<IActionResult> ObtenerSiguienteIncidente()
        {
            try
            {
                var siguienteCodigo = await _emergenciaService.ObtenerSiguienteIncidenteAsync();
                return Ok(new { numeroIncidente = siguienteCodigo });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR EMERGENCIAS SIGUIENTE]: {ex.Message}");
                return StatusCode(500, new { exito = false, mensaje = $"Error al obtener el siguiente incidente: {ex.Message}" });
            }
        }
    }
}
