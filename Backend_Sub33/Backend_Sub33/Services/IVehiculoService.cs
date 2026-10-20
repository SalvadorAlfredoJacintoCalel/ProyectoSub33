using Backend_Sub33.Common;
using Backend_Sub33.DTOs.Vehiculos;

namespace Backend_Sub33.Services;

public interface IVehiculoService
{
    Task<ServiceResult<VehiculoListResponseDto>> GetPaginadoAsync(VehiculoFiltrosDto filtros);
    Task<ServiceResult<VehiculoDto>> GetByIdAsync(int id);
    Task<ServiceResult<VehiculoDto>> CreateAsync(VehiculoCreateDto dto);
    Task<ServiceResult<VehiculoDto>> UpdateAsync(int id, VehiculoUpdateDto dto);
    Task<ServiceResult<VehiculoDto>> ChangeEstadoAsync(int id, string estado);
    Task<ServiceResult> DeleteAsync(int id);
    Task<ServiceResult<List<VehiculoMantenimientoDto>>> GetMantenimientosAsync(int vehiculoId);
    Task<ServiceResult<VehiculoMantenimientoDto>> CreateMantenimientoAsync(int vehiculoId, VehiculoMantenimientoCreateDto dto);
    Task<ServiceResult<VehiculoMantenimientoDto>> UpdateMantenimientoAsync(int id, VehiculoMantenimientoCreateDto dto);
    Task<ServiceResult> DeleteMantenimientoAsync(int id);
}
