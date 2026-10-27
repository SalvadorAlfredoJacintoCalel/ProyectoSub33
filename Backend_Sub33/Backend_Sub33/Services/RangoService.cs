using Backend_Sub33.Common;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs.Catalogos;
using Backend_Sub33.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend_Sub33.Services;

public class RangoService : IRangoService
{
    private readonly AppDbContext _context;
    private readonly ILogger<RangoService> _logger;

    public RangoService(AppDbContext context, ILogger<RangoService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ServiceResult<List<RangoResponseDto>>> GetActivosAsync(CancellationToken ct = default)
    {
        try
        {
            var rangos = await _context.CatRangos
                .AsNoTracking()
                .OrderBy(r => r.Rango)
                .ToListAsync(ct);

            return ServiceResult<List<RangoResponseDto>>.Success(rangos.Select(ToDto).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener la lista de rangos activos");
            return ServiceResult<List<RangoResponseDto>>.Internal("Error al obtener los rangos.");
        }
    }

    public async Task<ServiceResult<RangoResponseDto>> CreateAsync(CreateRangoDto dto, CancellationToken ct = default)
    {
        try
        {
            var nombre = TextNormalizer.NormalizeName(dto.Rango);
            if (nombre is null)
            {
                return ServiceResult<RangoResponseDto>.BadRequest("El nombre del rango es requerido.");
            }

            var existe = await _context.CatRangos
                .AnyAsync(r => r.Rango.ToLower() == nombre.ToLower(), ct);
            if (existe)
            {
                return ServiceResult<RangoResponseDto>.Conflict("El rango ya existe.");
            }

            var rango = new CatRango
            {
                Rango = nombre,
                Descripcion = TextNormalizer.NormalizeDescription(dto.Descripcion),
                CreatedAt = DateTime.UtcNow
            };

            _context.CatRangos.Add(rango);
            await _context.SaveChangesAsync(ct);

            return ServiceResult<RangoResponseDto>.Success(ToDto(rango));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear el rango");
            return ServiceResult<RangoResponseDto>.Internal("Error al crear el rango.");
        }
    }

    public async Task<ServiceResult<RangoResponseDto>> UpdateAsync(int id, UpdateRangoDto dto, CancellationToken ct = default)
    {
        try
        {
            var rango = await _context.CatRangos.FirstOrDefaultAsync(r => r.RangoId == id, ct);
            if (rango is null)
            {
                return ServiceResult<RangoResponseDto>.NotFound("El rango no existe.");
            }

            if (dto.Rango is not null)
            {
                var nombre = TextNormalizer.NormalizeName(dto.Rango);
                if (nombre is null)
                {
                    return ServiceResult<RangoResponseDto>.BadRequest("El nombre del rango es requerido.");
                }

                var existe = await _context.CatRangos
                    .AnyAsync(r => r.Rango.ToLower() == nombre.ToLower() && r.RangoId != id, ct);
                if (existe)
                {
                    return ServiceResult<RangoResponseDto>.Conflict("El rango ya existe.");
                }

                rango.Rango = nombre;
            }

            if (dto.Descripcion is not null)
            {
                rango.Descripcion = TextNormalizer.NormalizeDescription(dto.Descripcion);
            }

            await _context.SaveChangesAsync(ct);

            return ServiceResult<RangoResponseDto>.Success(ToDto(rango));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar el rango {Id}", id);
            return ServiceResult<RangoResponseDto>.Internal("Error al actualizar el rango.");
        }
    }

    public async Task<ServiceResult> DeleteAsync(int id, CancellationToken ct = default)
    {
        try
        {
            var rango = await _context.CatRangos.FirstOrDefaultAsync(r => r.RangoId == id, ct);
            if (rango is null)
            {
                return ServiceResult.NotFound("El rango no existe.");
            }

            _context.CatRangos.Remove(rango);
            await _context.SaveChangesAsync(ct);

            return ServiceResult.Success();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "No se pudo eliminar el rango {Id} por integridad referencial", id);
            return ServiceResult.Conflict("No se puede eliminar porque está asignado a uno o más miembros activos.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al eliminar el rango {Id}", id);
            return ServiceResult.Internal("Error al eliminar el rango.");
        }
    }

    private static RangoResponseDto ToDto(CatRango rango) => new()
    {
        RangoId = rango.RangoId,
        Rango = rango.Rango,
        Descripcion = rango.Descripcion
    };
}
