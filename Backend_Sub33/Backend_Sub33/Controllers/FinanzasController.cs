using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend_Sub33.Attributes;
using Backend_Sub33.Common;
using Backend_Sub33.DTOs.Finanzas;
using Backend_Sub33.Services;

namespace Backend_Sub33.Controllers;

[ApiController]
[Route("api/finanzas")]
[Authorize]
public class FinanzasController : ApiControllerBase
{
    private readonly IFinanzasService _finanzasService;
    private readonly ICurrentUser _currentUser;

    public FinanzasController(IFinanzasService finanzasService, ICurrentUser currentUser)
    {
        _finanzasService = finanzasService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [HttpRequirePermission("finanzas.ver")]
    public async Task<IActionResult> GetTransacciones(
        [FromQuery] string? tipo = null,
        [FromQuery] DateTime? fechaDesde = null,
        [FromQuery] DateTime? fechaHasta = null,
        [FromQuery] string? busqueda = null,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanio = 10)
    {
        var filtros = new TransaccionFiltrosDto
        {
            Tipo = tipo,
            FechaDesde = fechaDesde,
            FechaHasta = fechaHasta,
            Busqueda = busqueda,
            Pagina = pagina,
            TamanoPagina = tamanio
        };

        return Respond(await _finanzasService.ListarAsync(filtros));
    }

    [HttpGet("resumen")]
    [HttpRequirePermission("finanzas.ver")]
    public async Task<IActionResult> GetResumen([FromQuery] DateTime? desde = null, [FromQuery] DateTime? hasta = null)
        => Respond(await _finanzasService.ObtenerResumenAsync(desde, hasta));

    [HttpGet("{id:long}")]
    [HttpRequirePermission("finanzas.ver")]
    public async Task<IActionResult> GetTransaccion(long id)
        => Respond(await _finanzasService.ObtenerPorIdAsync(id));

    [HttpPost]
    [HttpRequirePermission("finanzas.crear")]
    public async Task<IActionResult> CreateTransaccion([FromBody] TransaccionCreateDto? dto)
    {
        if (dto is null)
        {
            return BadRequest(ApiResponse.Fail("El cuerpo de la solicitud es requerido."));
        }

        return Respond(
            await _finanzasService.CrearTransaccionAsync(dto),
            "Transacción registrada correctamente.",
            StatusCodes.Status201Created);
    }

    [HttpPut("{id:long}")]
    [HttpRequirePermission("finanzas.editar")]
    public async Task<IActionResult> UpdateTransaccion(long id, [FromBody] TransaccionUpdateDto? dto)
    {
        if (dto is null)
        {
            return BadRequest(ApiResponse.Fail("El cuerpo de la solicitud es requerido."));
        }

        return Respond(
            await _finanzasService.ActualizarTransaccionAsync(id, dto),
            "Transacción actualizada correctamente.");
    }

    [HttpDelete("{id:long}")]
    [HttpRequirePermission("finanzas.eliminar")]
    public async Task<IActionResult> DeleteTransaccion(long id)
        => Respond(await _finanzasService.EliminarTransaccionAsync(id), "Transacción eliminada correctamente.");

    [HttpPost("auto/gasto-mantenimiento")]
    public async Task<IActionResult> AutoGastoMantenimiento([FromBody] AutoGastoMantenimientoDto? dto)
    {
        if (dto is null)
        {
            return BadRequest(ApiResponse.Fail("El cuerpo de la solicitud es requerido."));
        }

        return Respond(
            await _finanzasService.CrearGastoDesdeMantenimientoAsync(
                dto.MantenimientoId,
                dto.Costo,
                dto.Descripcion,
                _currentUser.UsuarioId,
                dto.ResponsableNombre ?? string.Empty),
            "Gasto de mantenimiento registrado automáticamente.",
            StatusCodes.Status201Created);
    }

    [HttpPost("auto/ingreso-donacion")]
    public async Task<IActionResult> AutoIngresoDonacion([FromBody] AutoIngresoDonacionDto? dto)
    {
        if (dto is null)
        {
            return BadRequest(ApiResponse.Fail("El cuerpo de la solicitud es requerido."));
        }

        return Respond(
            await _finanzasService.CrearIngresoDesdeDonacionAsync(
                dto.DonacionId,
                dto.Monto,
                dto.Descripcion,
                _currentUser.UsuarioId,
                dto.ResponsableNombre ?? string.Empty),
            "Ingreso por donación registrado automáticamente.",
            StatusCodes.Status201Created);
    }
}
