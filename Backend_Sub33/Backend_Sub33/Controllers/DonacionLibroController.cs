using Microsoft.AspNetCore.Mvc;
using Backend_Sub33.Attributes;
using Backend_Sub33.DTOs.Donacion;
using Backend_Sub33.Services;

namespace Backend_Sub33.Controllers;

[ApiController]
[Route("api/donaciones/libro")]
public class DonacionLibroController : ApiControllerBase
{
    private readonly IDonacionLibroService _libroService;

    public DonacionLibroController(IDonacionLibroService libroService)
    {
        _libroService = libroService;
    }

    [HttpGet("{anio:int}/{mes:int}")]
    public async Task<IActionResult> GetLibro(int anio, int mes)
        => Respond(await _libroService.GetLibroAsync(anio, mes));

    [HttpRequirePermission("donaciones.libro.crear")]
    [HttpPost("movimientos")]
    public async Task<IActionResult> CreateMovimiento([FromBody] DonacionMovimientoCreateDto? dto)
    {
        if (dto is null)
        {
            return BadRequest("El cuerpo de la solicitud es requerido.");
        }

        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(
            await _libroService.CreateMovimientoAsync(dto),
            "Movimiento registrado correctamente.",
            StatusCodes.Status201Created);
    }

    [HttpRequirePermission("donaciones.libro.editar")]
    [HttpPut("movimientos/{id:int}")]
    public async Task<IActionResult> UpdateMovimiento(int id, [FromBody] DonacionMovimientoUpdateDto? dto)
    {
        if (dto is null)
        {
            return BadRequest("El cuerpo de la solicitud es requerido.");
        }

        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(
            await _libroService.UpdateMovimientoAsync(id, dto),
            "Movimiento actualizado correctamente.");
    }

    [HttpRequirePermission("donaciones.libro.eliminar")]
    [HttpDelete("movimientos/{id:int}")]
    public async Task<IActionResult> DeleteMovimiento(int id)
        => Respond(await _libroService.DeleteMovimientoAsync(id), "Movimiento eliminado correctamente.");
}
