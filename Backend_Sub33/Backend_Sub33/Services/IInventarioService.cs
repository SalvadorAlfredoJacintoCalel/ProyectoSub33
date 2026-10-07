using Backend_Sub33.Common;
using Backend_Sub33.DTOs.Inventario;

namespace Backend_Sub33.Services;

public interface IInventarioService
{
    Task<ServiceResult<PaginatedResult<InventarioItemDto>>> GetItemsAsync(InventarioItemFiltrosDto filtros);
    Task<ServiceResult<InventarioItemDto>> GetItemByIdAsync(int id);
    Task<ServiceResult<InventarioItemDto>> CreateItemAsync(InventarioItemCreateDto dto);
    Task<ServiceResult<InventarioItemDto>> UpdateItemAsync(int id, InventarioItemUpdateDto dto);
    Task<ServiceResult> DeleteItemAsync(int id);

    Task<ServiceResult<List<InventarioMovimientoDto>>> GetMovimientosAsync(int? itemId, int? tipoMovId, DateTime? desde, DateTime? hasta);
    Task<ServiceResult<InventarioMovimientoDto>> CreateMovimientoAsync(InventarioMovimientoCreateDto dto);

    Task<ServiceResult<List<EquipoUnidadDto>>> GetEquipoUnidadesAsync(int? unidadId);
    Task<ServiceResult> AsignarEquipoAsync(EquipoUnidadCreateDto dto);

    Task<ServiceResult<List<ServicioInsumoUtilizadoDto>>> GetInsumosUtilizadosAsync(int? servicioId);
    Task<ServiceResult> RegistrarUsoInsumoAsync(ServicioInsumoUtilizadoCreateDto dto);
}
