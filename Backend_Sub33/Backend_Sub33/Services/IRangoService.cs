using Backend_Sub33.Common;
using Backend_Sub33.DTOs.Catalogos;

namespace Backend_Sub33.Services;

public interface IRangoService
{
    Task<ServiceResult<List<RangoResponseDto>>> GetActivosAsync(CancellationToken ct = default);
    Task<ServiceResult<RangoResponseDto>> CreateAsync(CreateRangoDto dto, CancellationToken ct = default);
    Task<ServiceResult<RangoResponseDto>> UpdateAsync(int id, UpdateRangoDto dto, CancellationToken ct = default);
    Task<ServiceResult> DeleteAsync(int id, CancellationToken ct = default);
}
