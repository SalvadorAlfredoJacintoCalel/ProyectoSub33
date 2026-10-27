using Backend_Sub33.Common;
using Backend_Sub33.DTOs.Donacion;

namespace Backend_Sub33.Services;

public interface IDonacionService
{
    Task<ServiceResult<DonacionListResponseDto>> GetPaginadoAsync(DonacionFiltrosDto filtros);
    Task<ServiceResult<DonacionDto>> GetByIdAsync(int id);
    Task<ServiceResult<DonacionDto>> CreateAsync(DonacionCreateDto dto);
    Task<ServiceResult<DonacionDto>> UpdateAsync(int id, DonacionUpdateDto dto);
    Task<ServiceResult> ChangeEstadoAsync(int id, string estado);
    Task<ServiceResult> DeleteAsync(int id);
}
