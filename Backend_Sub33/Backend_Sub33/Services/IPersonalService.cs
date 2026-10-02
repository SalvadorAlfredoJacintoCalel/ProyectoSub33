using Backend_Sub33.Common;
using Backend_Sub33.DTOs.Personal;

namespace Backend_Sub33.Services;

public interface IPersonalService
{
    Task<ServiceResult<PaginatedResult<PersonalResumenDto>>> GetResumenAsync(
        int pagina, int tamanio, int? rangoId, bool? estado, CancellationToken ct = default);

    Task<ServiceResult<PersonalResponseDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ServiceResult<PersonalResponseDto>> CreateAsync(CreatePersonalDto dto, CancellationToken ct = default);
    Task<ServiceResult<PersonalResponseDto>> UpdateAsync(Guid id, UpdatePersonalDto dto, CancellationToken ct = default);
    Task<ServiceResult> ChangeEstadoAsync(Guid id, bool estado, CancellationToken ct = default);
    Task<ServiceResult> DeleteAsync(Guid id, CancellationToken ct = default);
}
