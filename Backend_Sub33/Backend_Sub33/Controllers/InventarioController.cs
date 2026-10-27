using Microsoft.AspNetCore.Mvc;
using Backend_Sub33.Attributes;
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
        [FromQuery] string? stockStatus = null,
        [FromQuery] string? estado = null,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanio = 10)
        {
            var filtros = new InventarioItemFiltrosDto
            {
                Busqueda = busqueda,
                CategoriaInvId = categoriaInvId,
                StockStatus = stockStatus,
                Estado = estado,
                Pagina = pagina,
                TamanoPagina = tamanio
            };

        return Respond(await _inventarioService.GetItemsAsync(filtros));
    }

    [HttpGet("items/{id:int}")]
    public async Task<IActionResult> GetItem(int id)
        => Respond(await _inventarioService.GetItemByIdAsync(id));

    [HttpRequirePermission("inventario.crear")]
    [HttpPost("items")]
    public async Task<IActionResult> CreateItem([FromBody] InventarioItemCreateDto? dto)
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
            await _inventarioService.CreateItemAsync(dto),
            "Item registrado correctamente.",
            StatusCodes.Status201Created);
    }

    [HttpRequirePermission("inventario.editar")]
    [HttpPut("items/{id:int}")]
    public async Task<IActionResult> UpdateItem(int id, [FromBody] InventarioItemUpdateDto? dto)
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
            await _inventarioService.UpdateItemAsync(id, dto),
            "Item actualizado correctamente.");
    }

    [HttpRequirePermission("inventario.baja")]
    [HttpPost("items/{id:int}/baja")]
    public async Task<IActionResult> DarDeBajaItem(int id, [FromBody] InventarioItemBajaDto dto)
        => Respond(
            await _inventarioService.DarDeBajaAsync(id, dto?.ResponsableId),
            "Item dado de baja correctamente.");

    [HttpRequirePermission("inventario.eliminar")]
    [HttpDelete("items/{id:int}")]
    public async Task<IActionResult> DeleteItem(int id)
        => Respond(await _inventarioService.DeleteItemAsync(id), "Item eliminado correctamente.");

    // ── Movimientos ──────────────────────────────────────────────────────────

    [HttpGet("movimientos")]
    public async Task<IActionResult> GetMovimientos(
        [FromQuery] int? itemId = null,
        [FromQuery] int? tipoMovId = null,
        [FromQuery] DateTime? desde = null,
        [FromQuery] DateTime? hasta = null,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanio = 15)
    {
        var filtros = new InventarioMovimientoFiltrosDto
        {
            ItemId = itemId,
            TipoMovId = tipoMovId,
            Desde = desde,
            Hasta = hasta,
            Pagina = pagina,
            TamanoPagina = tamanio
        };

        return Respond(await _inventarioService.GetMovimientosAsync(filtros));
    }

    [HttpGet("movimientos/tipos")]
    public async Task<IActionResult> GetTiposMovimiento([FromQuery] bool soloManuales = true)
        => Respond(await _inventarioService.GetTiposMovimientoAsync(soloManuales));

    [HttpRequirePermission("inventario.ajuste")]
    [HttpPost("movimientos")]
    public async Task<IActionResult> CreateMovimiento([FromBody] InventarioMovimientoCreateDto? dto)
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
            await _inventarioService.CreateMovimientoAsync(dto),
            "Movimiento registrado correctamente.",
            StatusCodes.Status201Created);
    }

    // ── Equipo-Unidades ──────────────────────────────────────────────────────

    [HttpGet("equipo-unidades")]
    public async Task<IActionResult> GetEquipoUnidades([FromQuery] int? unidadId = null)
        => Respond(await _inventarioService.GetEquipoUnidadesAsync(unidadId));

    [HttpRequirePermission("inventario.equipo-asignar")]
    [HttpPost("equipo-unidades")]
    public async Task<IActionResult> AsignarEquipo([FromBody] EquipoUnidadCreateDto? dto)
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
            await _inventarioService.AsignarEquipoAsync(dto),
            "Equipo asignado correctamente.",
            StatusCodes.Status201Created);
    }

    // ── Resumen ──────────────────────────────────────────────────────────────

    [HttpGet("resumen")]
    public async Task<IActionResult> GetResumen()
        => Respond(await _inventarioService.GetResumenAsync());

    // ── Servicio-Insumos ─────────────────────────────────────────────────────

    [HttpGet("servicio-insumos")]
    public async Task<IActionResult> GetServicioInsumos([FromQuery] int? servicioId = null)
        => Respond(await _inventarioService.GetInsumosUtilizadosAsync(servicioId));

    [HttpRequirePermission("inventario.registrar-uso-servicio")]
    [HttpPost("servicio-insumos")]
    public async Task<IActionResult> RegistrarUsoInsumo([FromBody] ServicioInsumoUtilizadoCreateDto? dto)
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
            await _inventarioService.RegistrarUsoInsumoAsync(dto),
            "Uso de insumo registrado correctamente.",
            StatusCodes.Status201Created);
    }
}
