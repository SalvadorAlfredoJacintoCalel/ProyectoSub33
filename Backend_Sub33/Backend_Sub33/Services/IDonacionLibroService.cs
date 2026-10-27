using Backend_Sub33.Common;
using Backend_Sub33.DTOs.Donacion;

namespace Backend_Sub33.Services;

public interface IDonacionLibroService
{
    Task<ServiceResult<DonacionLibroDto>> GetLibroAsync(int anio, int mes);
    Task<ServiceResult<DonacionMovimientoDto>> CreateMovimientoAsync(DonacionMovimientoCreateDto dto);
    Task<ServiceResult<DonacionMovimientoDto>> UpdateMovimientoAsync(int id, DonacionMovimientoUpdateDto dto);
    Task<ServiceResult> DeleteMovimientoAsync(int id);
}
