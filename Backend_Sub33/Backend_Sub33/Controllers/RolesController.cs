using Microsoft.AspNetCore.Mvc;
using Backend_Sub33.DTOs.Roles;
using Backend_Sub33.Services;

namespace Backend_Sub33.Controllers;

[ApiController]
[Route("api/roles")]
public class RolesController : ApiControllerBase
{
    private readonly IRolService _rolService;

    public RolesController(IRolService rolService)
    {
        _rolService = rolService;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoles(CancellationToken ct)
        => Respond(await _rolService.GetActivosAsync(ct));

    [HttpPost]
    public async Task<IActionResult> CrearRol([FromBody] CreateRolDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(await _rolService.CreateAsync(dto, ct), "Rol creado correctamente.", StatusCodes.Status201Created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarRol(int id, [FromBody] UpdateRolDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(await _rolService.UpdateAsync(id, dto, ct), "Rol actualizado correctamente.");
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarRol(int id, CancellationToken ct)
        => Respond(await _rolService.DeleteAsync(id, ct), "Rol eliminado correctamente.");
}
