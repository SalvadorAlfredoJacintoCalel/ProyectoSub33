using Microsoft.AspNetCore.Mvc;
using Backend_Sub33.DTOs.Inventario;
using Backend_Sub33.Services;

namespace Backend_Sub33.Controllers;

[ApiController]
[Route("api/inventario")]
public class InventarioController : ApiControllerBase
{
    private readonly IInventarioService _inventarioService;

    public InventarioController(IInventarioService inventarioService)
    {
        _inventarioService = inventarioService;
    }

    // ── Items ────────────────────────────────────────────────────────────────

    [HttpGet("items")]
    public async Task<IActionResult> GetItems(
        [FromQuery] string? busqueda = null,
        [FromQuery] int? categoriaInvId = null,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanio = 10)
    {
        var filtros = new InventarioItemFiltrosDto
        {
            Busqueda = busqueda,
            CategoriaInvId = categoriaInvId,
            Pagina = pagina,
            TamanoPagina = tamanio
        };

        return Respond(await _inventarioService.GetItemsAsync(filtros));
    }

    [HttpGet("items/{id:int}")]
    public async Task<IActionResult> GetItem(int id)
        => Respond(await _inventarioService.GetItemByIdAsync(id));

    [HttpPost("items")]
    public async Task<IActionResult> CreateItem([FromBody] InventarioItemCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(
            await _inventarioService.CreateItemAsync(dto),
            "Item registrado correctamente.",
            StatusCodes.Status201Created);
    }

    [HttpPut("items/{id:int}")]
    public async Task<IActionResult> UpdateItem(int id, [FromBody] InventarioItemUpdateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(
            await _inventarioService.UpdateItemAsync(id, dto),
            "Item actualizado correctamente.");
    }

    [HttpDelete("items/{id:int}")]
    public async Task<IActionResult> DeleteItem(int id)
        => Respond(await _inventarioService.DeleteItemAsync(id), "Item eliminado correctamente.");

    // ── Movimientos ──────────────────────────────────────────────────────────

    [HttpGet("movimientos")]
    public async Task<IActionResult> GetMovimientos(
        [FromQuery] int? itemId = null,
        [FromQuery] int? tipoMovId = null,
        [FromQuery] DateTime? desde = null,
        [FromQuery] DateTime? hasta = null)
        => Respond(await _inventarioService.GetMovimientosAsync(itemId, tipoMovId, desde, hasta));

    [HttpPost("movimientos")]
    public async Task<IActionResult> CreateMovimiento([FromBody] InventarioMovimientoCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(
            await _inventarioService.CreateMovimientoAsync(dto),
            "Movimiento registrado correctamente.",
            StatusCodes.Status201Created);
    }

    // ── Equipo-Unidades ──────────────────────────────────────────────────────

    [HttpGet("equipo-unidades")]
    public async Task<IActionResult> GetEquipoUnidades([FromQuery] int? unidadId = null)
        => Respond(await _inventarioService.GetEquipoUnidadesAsync(unidadId));

    [HttpPost("equipo-unidades")]
    public async Task<IActionResult> AsignarEquipo([FromBody] EquipoUnidadCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(
            await _inventarioService.AsignarEquipoAsync(dto),
            "Equipo asignado correctamente.",
            StatusCodes.Status201Created);
    }

    // ── Servicio-Insumos ─────────────────────────────────────────────────────

    [HttpGet("servicio-insumos")]
    public async Task<IActionResult> GetServicioInsumos([FromQuery] int? servicioId = null)
        => Respond(await _inventarioService.GetInsumosUtilizadosAsync(servicioId));

    [HttpPost("servicio-insumos")]
    public async Task<IActionResult> RegistrarUsoInsumo([FromBody] ServicioInsumoUtilizadoCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return InvalidModel(ModelState);
        }

        return Respond(
            await _inventarioService.RegistrarUsoInsumoAsync(dto),
            "Uso de insumo registrado correctamente.",
            StatusCodes.Status201Created);
    }
}
