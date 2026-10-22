using Microsoft.AspNetCore.Mvc;
using Backend_Sub33.Attributes;
using Backend_Sub33.DTOs.Vehiculos;
using Backend_Sub33.Services;
namespace Backend_Sub33.Controllers;

[ApiController]
[Route("api/vehiculos/cupones")]
public class CuponesController : ApiControllerBase
{
    private readonly ICuponService _cuponService;

    public CuponesController(ICuponService cuponService)
    {
        _cuponService = cuponService;
    }

    [HttpRequirePermission("vehiculos.cupones.ver")]
    [HttpGet("periodos/{anio:int}/{mes:int}")]
    public async Task<IActionResult> GetPeriodo(int anio, int mes)
        => Respond(await _cuponService.GetPeriodoAsync(anio, mes));

    [HttpRequirePermission("vehiculos.cupones.imprimir")]
    [HttpGet("periodos/{anio:int}/{mes:int}/reporte")]
    public async Task<IActionResult> GetReporteImpresion(int anio, int mes)
        => Respond(await _cuponService.GetReporteImpresionAsync(anio, mes));

    [HttpRequirePermission("vehiculos.cupones.periodos")]
    [HttpPut("periodos")]
    public async Task<IActionResult> SavePeriodo([FromBody] CuponPeriodoCreateDto? dto)
    {
        if (dto is null)
        {
            return BadRequest("El cuerpo de la solicitud es requerido.");
        }

        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(await _cuponService.SavePeriodoAsync(dto), "Período actualizado correctamente.");
    }

    [HttpRequirePermission("vehiculos.cupones.crear")]
    [HttpPost]
    public async Task<IActionResult> CreateCupon([FromBody] CuponCreateDto? dto)
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
            await _cuponService.CreateAsync(dto),
            "Cupón registrado correctamente.",
            StatusCodes.Status201Created);
    }

    [HttpRequirePermission("vehiculos.cupones.editar")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateCupon(int id, [FromBody] CuponUpdateDto? dto)
    {
        if (dto is null)
        {
            return BadRequest("El cuerpo de la solicitud es requerido.");
        }

        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(await _cuponService.UpdateAsync(id, dto), "Cupón actualizado correctamente.");
    }

    [HttpRequirePermission("vehiculos.cupones.eliminar")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCupon(int id)
        => Respond(await _cuponService.DeleteAsync(id), "Cupón eliminado correctamente.");
}
