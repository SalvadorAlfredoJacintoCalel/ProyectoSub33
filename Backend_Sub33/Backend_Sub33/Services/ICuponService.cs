using Backend_Sub33.Common;
using Backend_Sub33.DTOs.Vehiculos;

namespace Backend_Sub33.Services;

public interface ICuponService
{
    Task<ServiceResult<CuponPeriodoDto>> GetPeriodoAsync(int anio, int mes);
    Task<ServiceResult<CuponPeriodoDto>> SavePeriodoAsync(CuponPeriodoCreateDto dto);
    Task<ServiceResult<ReporteCuponesDto>> GetReporteImpresionAsync(int anio, int mes);
    Task<ServiceResult<VehiculoCuponDto>> CreateAsync(CuponCreateDto dto);
    Task<ServiceResult<VehiculoCuponDto>> UpdateAsync(int id, CuponUpdateDto dto);
    Task<ServiceResult> DeleteAsync(int id);
}
