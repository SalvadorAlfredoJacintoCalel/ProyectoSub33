using Microsoft.AspNetCore.Mvc;
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

    [HttpGet("periodos/{anio:int}/{mes:int}")]
    public async Task<IActionResult> GetPeriodo(int anio, int mes)
        => Respond(await _cuponService.GetPeriodoAsync(anio, mes));

    [HttpPut("periodos")]
    public async Task<IActionResult> SavePeriodo([FromBody] CuponPeriodoCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(await _cuponService.SavePeriodoAsync(dto), "Período actualizado correctamente.");
    }

    [HttpPost]
    public async Task<IActionResult> CreateCupon([FromBody] CuponCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(
            await _cuponService.CreateAsync(dto),
            "Cupón registrado correctamente.",
            StatusCodes.Status201Created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateCupon(int id, [FromBody] CuponUpdateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(await _cuponService.UpdateAsync(id, dto), "Cupón actualizado correctamente.");
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCupon(int id)
        => Respond(await _cuponService.DeleteAsync(id), "Cupón eliminado correctamente.");
}
