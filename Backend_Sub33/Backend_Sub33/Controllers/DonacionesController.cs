using Microsoft.AspNetCore.Mvc;
using Backend_Sub33.Common;
using Backend_Sub33.DTOs.Donacion;
using Backend_Sub33.Services;

namespace Backend_Sub33.Controllers;

[ApiController]
[Route("api/donaciones")]
public class DonacionesController : ApiControllerBase
{
    private readonly IDonacionService _donacionService;

    public DonacionesController(IDonacionService donacionService)
    {
        _donacionService = donacionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDonaciones(
        [FromQuery] string? busqueda = null,
        [FromQuery] string? tipo = null,
        [FromQuery] string? categoria = null,
        [FromQuery] string? estado = null,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanio = 10)
    {
        var filtros = new DonacionFiltrosDto
        {
            Busqueda = busqueda,
            Tipo = tipo,
            Categoria = categoria,
            Estado = estado,
            Pagina = pagina,
            TamanoPagina = tamanio
        };

        return Respond(await _donacionService.GetPaginadoAsync(filtros));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDonacion(int id)
        => Respond(await _donacionService.GetByIdAsync(id));

    [HttpPost]
    public async Task<IActionResult> CreateDonacion([FromBody] DonacionCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(
            await _donacionService.CreateAsync(dto),
            "Donación registrada correctamente.",
            StatusCodes.Status201Created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateDonacion(int id, [FromBody] DonacionUpdateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(
            await _donacionService.UpdateAsync(id, dto),
            "Donación actualizada correctamente.");
    }

    [HttpPatch("{id:int}/estado")]
    public async Task<IActionResult> ChangeEstado(int id, [FromBody] DonacionCambiarEstadoDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Estado))
        {
            return BadRequest(ApiResponse.Fail("El estado es obligatorio."));
        }

        return Respond(
            await _donacionService.ChangeEstadoAsync(id, dto.Estado),
            "Estado actualizado correctamente.");
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteDonacion(int id)
        => Respond(await _donacionService.DeleteAsync(id), "Donación eliminada correctamente.");
}
