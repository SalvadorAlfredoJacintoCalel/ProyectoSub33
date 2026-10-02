using Microsoft.AspNetCore.Mvc;
using Backend_Sub33.DTOs.Personal;
using Backend_Sub33.Services;

namespace Backend_Sub33.Controllers;

[ApiController]
[Route("api/personal")]
public class PersonalController : ApiControllerBase
{
    private readonly IPersonalService _personalService;

    public PersonalController(IPersonalService personalService)
    {
        _personalService = personalService;
    }

    [HttpGet]
    public async Task<IActionResult> GetResumen(
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanio = 10,
        [FromQuery] int? rangoId = null,
        [FromQuery] bool? estado = null,
        CancellationToken ct = default)
        => Respond(await _personalService.GetResumenAsync(pagina, tamanio, rangoId, estado, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => Respond(await _personalService.GetByIdAsync(id, ct));

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CreatePersonalDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(
            await _personalService.CreateAsync(dto, ct),
            "Personal registrado correctamente.",
            StatusCodes.Status201Created);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Actualizar(Guid id, [FromBody] UpdatePersonalDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(
            await _personalService.UpdateAsync(id, dto, ct),
            "Personal actualizado correctamente.");
    }

    [HttpPatch("{id:guid}/estado")]
    public async Task<IActionResult> CambiarEstado(Guid id, [FromBody] CambiarEstadoDto dto, CancellationToken ct)
        => Respond(
            await _personalService.ChangeEstadoAsync(id, dto.Estado, ct),
            dto.Estado ? "Personal activado correctamente." : "Personal desactivado correctamente.");

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Eliminar(Guid id, CancellationToken ct)
        => Respond(await _personalService.DeleteAsync(id, ct), "Personal desactivado correctamente.");
}
