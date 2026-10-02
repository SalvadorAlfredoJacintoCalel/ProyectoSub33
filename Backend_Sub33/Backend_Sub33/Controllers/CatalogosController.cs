using Microsoft.AspNetCore.Mvc;
using Backend_Sub33.DTOs.Catalogos;
using Backend_Sub33.Services;

namespace Backend_Sub33.Controllers;

[ApiController]
[Route("api/catalogos")]
public class CatalogosController : ApiControllerBase
{
    private readonly IRangoService _rangoService;

    public CatalogosController(IRangoService rangoService)
    {
        _rangoService = rangoService;
    }

    [HttpGet("rangos")]
    public async Task<IActionResult> GetRangos(CancellationToken ct)
        => Respond(await _rangoService.GetActivosAsync(ct));

    [HttpGet("rangos/select")]
    public async Task<IActionResult> GetRangosForSelect(CancellationToken ct)
    {
        var result = await _rangoService.GetActivosAsync(ct);
        if (!result.IsSuccess) return Respond(result);
        var data = result.Data?.Select(r => new { id = r.RangoId, nombre = r.Rango }).ToArray() ?? Array.Empty<object>();
        return Ok(data);
    }

    [HttpPost("rangos")]
    public async Task<IActionResult> CrearRango([FromBody] CreateRangoDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(await _rangoService.CreateAsync(dto, ct), "Rango creado correctamente.", StatusCodes.Status201Created);
    }

    [HttpPut("rangos/{id:int}")]
    public async Task<IActionResult> ActualizarRango(int id, [FromBody] UpdateRangoDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(await _rangoService.UpdateAsync(id, dto, ct), "Rango actualizado correctamente.");
    }

    [HttpDelete("rangos/{id:int}")]
    public async Task<IActionResult> EliminarRango(int id, CancellationToken ct)
        => Respond(await _rangoService.DeleteAsync(id, ct), "Rango eliminado correctamente.");
}
