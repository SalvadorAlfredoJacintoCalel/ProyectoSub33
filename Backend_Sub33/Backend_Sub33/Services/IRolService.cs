using Backend_Sub33.Common;
using Backend_Sub33.DTOs.Roles;

namespace Backend_Sub33.Services;

public interface IRolService
{
    Task<ServiceResult<List<RolResponseDto>>> GetActivosAsync(CancellationToken ct = default);
    Task<ServiceResult<RolResponseDto>> CreateAsync(CreateRolDto dto, CancellationToken ct = default);
    Task<ServiceResult<RolResponseDto>> UpdateAsync(int id, UpdateRolDto dto, CancellationToken ct = default);
    Task<ServiceResult> DeleteAsync(int id, CancellationToken ct = default);
}
