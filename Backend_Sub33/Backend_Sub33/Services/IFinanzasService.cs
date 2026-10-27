using System;
using System.Threading.Tasks;
using Backend_Sub33.Common;
using Backend_Sub33.DTOs.Finanzas;

namespace Backend_Sub33.Services;

public interface IFinanzasService
{
    Task<ServiceResult<TransaccionListResponseDto>> ListarAsync(TransaccionFiltrosDto filtros);
    Task<ServiceResult<TransaccionDto>> ObtenerPorIdAsync(long id);
    Task<ServiceResult<ResumenFinancieroDto>> ObtenerResumenAsync(DateTime? desde, DateTime? hasta);
    Task<ServiceResult<TransaccionDto>> CrearTransaccionAsync(TransaccionCreateDto dto);
    Task<ServiceResult<TransaccionDto>> ActualizarTransaccionAsync(long id, TransaccionUpdateDto dto);
    Task<ServiceResult> EliminarTransaccionAsync(long id);
    Task<ServiceResult<TransaccionDto>> CrearGastoDesdeMantenimientoAsync(int mantenimientoId, decimal costo, string descripcion, Guid responsableId, string responsableNombre);
    Task<ServiceResult<TransaccionDto>> CrearIngresoDesdeDonacionAsync(int donacionId, decimal monto, string descripcion, Guid responsableId, string responsableNombre);
}
