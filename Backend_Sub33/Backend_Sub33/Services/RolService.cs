using Backend_Sub33.Common;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs.Roles;
using Backend_Sub33.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_Sub33.Services;

public class RolService : IRolService
{
    private readonly AppDbContext _context;
    private readonly ILogger<RolService> _logger;

    public RolService(AppDbContext context, ILogger<RolService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ServiceResult<List<RolResponseDto>>> GetActivosAsync(CancellationToken ct = default)
    {
        try
        {
            var roles = await _context.Roles
                .AsNoTracking()
                .OrderBy(r => r.Nombre)
                .ToListAsync(ct);

            return ServiceResult<List<RolResponseDto>>.Success(roles.Select(ToDto).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener la lista de roles activos");
            return ServiceResult<List<RolResponseDto>>.Internal("Error al obtener los roles.");
        }
    }

    public async Task<ServiceResult<RolResponseDto>> CreateAsync(CreateRolDto dto, CancellationToken ct = default)
    {
        try
        {
            var nombre = TextNormalizer.NormalizeName(dto.Nombre);
            if (nombre is null)
            {
                return ServiceResult<RolResponseDto>.BadRequest("El nombre del rol es requerido.");
            }

            var existe = await _context.Roles
                .AnyAsync(r => r.Nombre.ToLower() == nombre.ToLower(), ct);
            if (existe)
            {
                return ServiceResult<RolResponseDto>.Conflict("El rol ya existe.");
            }

            var rol = new Rol
            {
                Nombre = nombre,
                Descripcion = TextNormalizer.NormalizeDescription(dto.Descripcion),
                CreatedAt = DateTime.UtcNow
            };

            _context.Roles.Add(rol);
            await _context.SaveChangesAsync(ct);

            return ServiceResult<RolResponseDto>.Success(ToDto(rol));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear el rol");
            return ServiceResult<RolResponseDto>.Internal("Error al crear el rol.");
        }
    }

    public async Task<ServiceResult<RolResponseDto>> UpdateAsync(int id, UpdateRolDto dto, CancellationToken ct = default)
    {
        try
        {
            var rol = await _context.Roles.FirstOrDefaultAsync(r => r.RolId == id, ct);
            if (rol is null)
            {
                return ServiceResult<RolResponseDto>.NotFound("El rol no existe.");
            }

            if (dto.Nombre is not null)
            {
                var nombre = TextNormalizer.NormalizeName(dto.Nombre);
                if (nombre is null)
                {
                    return ServiceResult<RolResponseDto>.BadRequest("El nombre del rol es requerido.");
                }

                var existe = await _context.Roles
                    .AnyAsync(r => r.Nombre.ToLower() == nombre.ToLower() && r.RolId != id, ct);
                if (existe)
                {
                    return ServiceResult<RolResponseDto>.Conflict("El rol ya existe.");
                }

                rol.Nombre = nombre;
            }

            if (dto.Descripcion is not null)
            {
                rol.Descripcion = TextNormalizer.NormalizeDescription(dto.Descripcion);
            }

            await _context.SaveChangesAsync(ct);

            return ServiceResult<RolResponseDto>.Success(ToDto(rol));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar el rol {Id}", id);
            return ServiceResult<RolResponseDto>.Internal("Error al actualizar el rol.");
        }
    }

    public async Task<ServiceResult> DeleteAsync(int id, CancellationToken ct = default)
    {
        try
        {
            var rol = await _context.Roles.FirstOrDefaultAsync(r => r.RolId == id, ct);
            if (rol is null)
            {
                return ServiceResult.NotFound("El rol no existe.");
            }

            _context.Roles.Remove(rol);
            await _context.SaveChangesAsync(ct);

            return ServiceResult.Success();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "No se pudo eliminar el rol {Id} por integridad referencial", id);
            return ServiceResult.Conflict("No se puede eliminar porque está asignado a uno o más miembros activos.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al eliminar el rol {Id}", id);
            return ServiceResult.Internal("Error al eliminar el rol.");
        }
    }

    private static RolResponseDto ToDto(Rol rol) => new()
    {
        RolId = rol.RolId,
        Nombre = rol.Nombre,
        Descripcion = rol.Descripcion
    };
}
