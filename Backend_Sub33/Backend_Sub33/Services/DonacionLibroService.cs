using System.Data;
using System.Data.Common;
using Dapper;
using Microsoft.EntityFrameworkCore;
using Backend_Sub33.Common;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs.Donacion;

namespace Backend_Sub33.Services;

public class DonacionLibroService : IDonacionLibroService
{
    private readonly AppDbContext _context;

    public DonacionLibroService(AppDbContext context)
    {
        _context = context;
    }

    private DbConnection AbrirConexion()
    {
        var connection = _context.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            connection.Open();
        }
        return connection;
    }

    private const string MovimientoSelect = @"
        SELECT m.movimiento_id, m.libro_id, m.fecha, m.descripcion, m.firmado,
               m.tipo_documento_id, td.nombre AS tipo_documento_nombre,
               m.no_documento, m.entrada, m.salida, m.saldo,
               m.donacion_id, m.vehiculo_id, m.created_at
        FROM donacion_movimientos m
        LEFT JOIN cat_tipos_documento td ON td.tipo_documento_id = m.tipo_documento_id";

    public async Task<ServiceResult<DonacionLibroDto>> GetLibroAsync(int anio, int mes)
    {
        if (anio < 2000 || anio > 2100 || mes < 1 || mes > 12)
        {
            return ServiceResult<DonacionLibroDto>.BadRequest("Período inválido.");
        }

        using var connection = AbrirConexion();
        using var transaction = connection.BeginTransaction();

        try
        {
            var libroId = await DonacionLibroHelper.EnsureLibroAsync(connection, transaction, anio, mes);
            await DonacionLibroHelper.RecalcularTodosAsync(connection, transaction);
            transaction.Commit();

            var libro = await connection.QueryFirstOrDefaultAsync<DonacionLibroDto>(@"
                SELECT libro_id, anio, mes, saldo_inicial, saldo_final, notas
                FROM donacion_libros WHERE libro_id = @Id", new { Id = libroId });

            if (libro == null)
            {
                return ServiceResult<DonacionLibroDto>.NotFound("Libro no encontrado.");
            }

            libro.Movimientos = (await connection.QueryAsync<DonacionMovimientoDto>(
                $"{MovimientoSelect} WHERE m.libro_id = @Id ORDER BY m.fecha, m.movimiento_id",
                new { Id = libroId })).ToList();

            libro.TotalEntradas = libro.Movimientos.Sum(m => m.Entrada);
            libro.TotalSalidas = libro.Movimientos.Sum(m => m.Salida);

            return ServiceResult<DonacionLibroDto>.Success(libro);
        }
        catch (Exception ex)
        {
            try { transaction.Rollback(); } catch { }
            return ServiceResult<DonacionLibroDto>.Internal($"Error al obtener el libro: {ex.Message}");
        }
    }

    public async Task<ServiceResult<DonacionMovimientoDto>> CreateMovimientoAsync(DonacionMovimientoCreateDto dto)
    {
        var validacion = Validar(dto.Fecha, dto.Descripcion, dto.Entrada, dto.Salida);
        if (validacion != null)
        {
            return ServiceResult<DonacionMovimientoDto>.BadRequest(validacion);
        }

        if (dto.Anio < 2000 || dto.Anio > 2100 || dto.Mes < 1 || dto.Mes > 12)
        {
            return ServiceResult<DonacionMovimientoDto>.BadRequest("Período inválido.");
        }

        using var connection = AbrirConexion();
        using var transaction = connection.BeginTransaction();

        try
        {
            var libroId = await DonacionLibroHelper.EnsureLibroAsync(connection, transaction, dto.Anio, dto.Mes);

            var id = await connection.QuerySingleAsync<int>(@"
                INSERT INTO donacion_movimientos
                    (libro_id, fecha, descripcion, firmado, tipo_documento_id, no_documento,
                     entrada, salida, saldo, created_at)
                VALUES
                    (@LibroId, @Fecha, @Descripcion, @Firmado, @TipoDocumentoId, @NoDocumento,
                     @Entrada, @Salida, 0, CURRENT_TIMESTAMP)
                RETURNING movimiento_id;",
                new
                {
                    LibroId = libroId,
                    Fecha = dto.Fecha.Date,
                    Descripcion = dto.Descripcion.Trim(),
                    dto.Firmado,
                    dto.TipoDocumentoId,
                    NoDocumento = string.IsNullOrWhiteSpace(dto.NoDocumento) ? null : dto.NoDocumento.Trim(),
                    dto.Entrada,
                    dto.Salida
                }, transaction);

            await DonacionLibroHelper.RecalcularTodosAsync(connection, transaction);
            transaction.Commit();

            var creado = await connection.QueryFirstOrDefaultAsync<DonacionMovimientoDto>(
                $"{MovimientoSelect} WHERE m.movimiento_id = @Id", new { Id = id });

            return ServiceResult<DonacionMovimientoDto>.Success(creado!);
        }
        catch (Exception ex)
        {
            try { transaction.Rollback(); } catch { }
            return ServiceResult<DonacionMovimientoDto>.Internal($"Error al registrar el movimiento: {ex.Message}");
        }
    }

    public async Task<ServiceResult<DonacionMovimientoDto>> UpdateMovimientoAsync(
        int id, DonacionMovimientoUpdateDto dto)
    {
        var validacion = Validar(dto.Fecha, dto.Descripcion, dto.Entrada, dto.Salida);
        if (validacion != null)
        {
            return ServiceResult<DonacionMovimientoDto>.BadRequest(validacion);
        }

        using var connection = AbrirConexion();
        using var transaction = connection.BeginTransaction();

        try
        {
            var existe = await connection.ExecuteScalarAsync<bool>(
                "SELECT EXISTS(SELECT 1 FROM donacion_movimientos WHERE movimiento_id = @Id)",
                new { Id = id }, transaction);
            if (!existe)
            {
                return ServiceResult<DonacionMovimientoDto>.NotFound("Movimiento no encontrado.");
            }

            var libroId = await DonacionLibroHelper.EnsureLibroAsync(
                connection, transaction, dto.Fecha.Year, dto.Fecha.Month);

            await connection.ExecuteAsync(@"
                UPDATE donacion_movimientos SET
                    libro_id = @LibroId,
                    fecha = @Fecha,
                    descripcion = @Descripcion,
                    firmado = @Firmado,
                    tipo_documento_id = @TipoDocumentoId,
                    no_documento = @NoDocumento,
                    entrada = @Entrada,
                    salida = @Salida
                WHERE movimiento_id = @Id",
                new
                {
                    Id = id,
                    LibroId = libroId,
                    Fecha = dto.Fecha.Date,
                    Descripcion = dto.Descripcion.Trim(),
                    dto.Firmado,
                    dto.TipoDocumentoId,
                    NoDocumento = string.IsNullOrWhiteSpace(dto.NoDocumento) ? null : dto.NoDocumento.Trim(),
                    dto.Entrada,
                    dto.Salida
                }, transaction);

            await DonacionLibroHelper.RecalcularTodosAsync(connection, transaction);
            transaction.Commit();

            var actualizado = await connection.QueryFirstOrDefaultAsync<DonacionMovimientoDto>(
                $"{MovimientoSelect} WHERE m.movimiento_id = @Id", new { Id = id });

            return ServiceResult<DonacionMovimientoDto>.Success(actualizado!);
        }
        catch (Exception ex)
        {
            try { transaction.Rollback(); } catch { }
            return ServiceResult<DonacionMovimientoDto>.Internal($"Error al actualizar el movimiento: {ex.Message}");
        }
    }

    public async Task<ServiceResult> DeleteMovimientoAsync(int id)
    {
        using var connection = AbrirConexion();
        using var transaction = connection.BeginTransaction();

        try
        {
            var afectados = await connection.ExecuteAsync(
                "DELETE FROM donacion_movimientos WHERE movimiento_id = @Id",
                new { Id = id }, transaction);
            if (afectados == 0)
            {
                return ServiceResult.NotFound("Movimiento no encontrado.");
            }

            await DonacionLibroHelper.RecalcularTodosAsync(connection, transaction);
            transaction.Commit();
            return ServiceResult.Success();
        }
        catch (Exception ex)
        {
            try { transaction.Rollback(); } catch { }
            return ServiceResult.Internal($"Error al eliminar el movimiento: {ex.Message}");
        }
    }

    private static string? Validar(DateTime fecha, string? descripcion, decimal entrada, decimal salida)
    {
        if (fecha == default) return "La fecha es obligatoria.";
        if (string.IsNullOrWhiteSpace(descripcion)) return "La descripción es obligatoria.";
        if (entrada < 0 || salida < 0) return "Los montos no pueden ser negativos.";
        if (entrada == 0 && salida == 0) return "Debe registrar una entrada o una salida.";
        return null;
    }
}
