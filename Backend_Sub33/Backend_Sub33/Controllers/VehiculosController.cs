using Microsoft.AspNetCore.Mvc;
using Backend_Sub33.Attributes;
using Backend_Sub33.DTOs.Vehiculos;
using Backend_Sub33.Services;

namespace Backend_Sub33.Controllers;

[ApiController]
[Route("api/vehiculos")]
public class VehiculosController : ApiControllerBase
{
    private readonly IVehiculoService _vehiculoService;

    public VehiculosController(IVehiculoService vehiculoService)
    {
        _vehiculoService = vehiculoService;
    }

    [HttpGet]
    public async Task<IActionResult> GetVehiculos(
        [FromQuery] string? busqueda = null,
        [FromQuery] int? tipoId = null,
        [FromQuery] string? estadoOperativo = null,
        [FromQuery] string? origen = null,
        [FromQuery] string? estado = null,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanio = 10)
    {
        var filtros = new VehiculoFiltrosDto
        {
            Busqueda = busqueda,
            TipoId = tipoId,
            EstadoOperativo = estadoOperativo,
            Origen = origen,
            Estado = estado,
            Pagina = pagina,
            TamanoPagina = tamanio
        };

        return Respond(await _vehiculoService.GetPaginadoAsync(filtros));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetVehiculo(int id)
        => Respond(await _vehiculoService.GetByIdAsync(id));

    [HttpRequirePermission("vehiculos.crear")]
    [HttpPost]
    public async Task<IActionResult> CreateVehiculo([FromBody] VehiculoCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(
            await _vehiculoService.CreateAsync(dto),
            "Vehículo registrado correctamente.",
            StatusCodes.Status201Created);
    }

    [HttpRequirePermission("vehiculos.editar")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateVehiculo(int id, [FromBody] VehiculoUpdateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(await _vehiculoService.UpdateAsync(id, dto), "Vehículo actualizado correctamente.");
    }

    [HttpRequirePermission("vehiculos.cambiar-estado")]
    [HttpPatch("{id:int}/estado")]
    public async Task<IActionResult> ChangeEstado(int id, [FromBody] VehiculoEstadoDto dto)
        => Respond(await _vehiculoService.ChangeEstadoAsync(id, dto.Estado), "Estado actualizado correctamente.");

    [HttpRequirePermission("vehiculos.estado-operativo")]
    [HttpPatch("{id:int}/estado-operativo")]
    public async Task<IActionResult> ChangeEstadoOperativo(int id, [FromBody] VehiculoEstadoOperativoDto dto)
        => Respond(
            await _vehiculoService.ChangeEstadoOperativoAsync(id, dto.EstadoOperativo),
            "Estado operativo actualizado correctamente.");

    [HttpRequirePermission("vehiculos.eliminar")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteVehiculo(int id)
        => Respond(await _vehiculoService.DeleteAsync(id), "Vehículo desactivado correctamente.");

    // ── Mantenimientos ───────────────────────────────────────────────────────
    [HttpGet("{id:int}/mantenimientos")]
    public async Task<IActionResult> GetMantenimientos(int id)
        => Respond(await _vehiculoService.GetMantenimientosAsync(id));

    [HttpRequirePermission("vehiculos.mantenimientos.crear")]
    [HttpPost("{id:int}/mantenimientos")]
    public async Task<IActionResult> CreateMantenimiento(int id, [FromBody] VehiculoMantenimientoCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(
            await _vehiculoService.CreateMantenimientoAsync(id, dto),
            "Mantenimiento registrado correctamente.",
            StatusCodes.Status201Created);
    }

    [HttpRequirePermission("vehiculos.mantenimientos.editar")]
    [HttpPut("mantenimientos/{id:int}")]
    public async Task<IActionResult> UpdateMantenimiento(int id, [FromBody] VehiculoMantenimientoCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(
            await _vehiculoService.UpdateMantenimientoAsync(id, dto),
            "Mantenimiento actualizado correctamente.");
    }

    [HttpRequirePermission("vehiculos.mantenimientos.eliminar")]
    [HttpDelete("mantenimientos/{id:int}")]
    public async Task<IActionResult> DeleteMantenimiento(int id)
        => Respond(await _vehiculoService.DeleteMantenimientoAsync(id), "Mantenimiento eliminado correctamente.");
}
