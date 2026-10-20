using System.Data.Common;
using Dapper;

namespace Backend_Sub33.Services;

/// <summary>
/// Utilidades transaccionales para el libro mensual de donaciones.
/// El saldo se calcula siempre en servidor: saldo_inicial del mes = saldo_final del mes anterior.
/// </summary>
public static class DonacionLibroHelper
{
    private sealed class LibroRow
    {
        public int LibroId { get; set; }
        public int Anio { get; set; }
        public int Mes { get; set; }
        public decimal SaldoInicial { get; set; }
    }

    private sealed class MovimientoRow
    {
        public int MovimientoId { get; set; }
        public decimal Entrada { get; set; }
        public decimal Salida { get; set; }
    }

    public static async Task<int> EnsureLibroAsync(DbConnection connection, DbTransaction? transaction, int anio, int mes)
    {
        var id = await connection.QueryFirstOrDefaultAsync<int?>(
            "SELECT libro_id FROM donacion_libros WHERE anio = @Anio AND mes = @Mes LIMIT 1",
            new { Anio = anio, Mes = mes }, transaction);

        if (id.HasValue)
        {
            return id.Value;
        }

        return await connection.QuerySingleAsync<int>(@"
            INSERT INTO donacion_libros (anio, mes, saldo_inicial, saldo_final, created_at, updated_at)
            VALUES (@Anio, @Mes, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING libro_id;",
            new { Anio = anio, Mes = mes }, transaction);
    }

    /// <summary>
    /// Recalcula el saldo corrido de todos los meses en orden cronológico.
    /// Saldo inicial del primer mes = el que ya tuviera; los siguientes arrastran el final anterior.
    /// </summary>
    public static async Task RecalcularTodosAsync(DbConnection connection, DbTransaction? transaction)
    {
        var libros = (await connection.QueryAsync<LibroRow>(@"
            SELECT libro_id, anio, mes, saldo_inicial
            FROM donacion_libros
            ORDER BY anio, mes", transaction: transaction)).ToList();

        decimal? finalAnterior = null;

        foreach (var libro in libros)
        {
            var saldoInicial = finalAnterior ?? libro.SaldoInicial;

            if (saldoInicial != libro.SaldoInicial)
            {
                await connection.ExecuteAsync(
                    "UPDATE donacion_libros SET saldo_inicial = @Saldo WHERE libro_id = @Id",
                    new { Saldo = saldoInicial, Id = libro.LibroId }, transaction);
            }

            var movimientos = (await connection.QueryAsync<MovimientoRow>(@"
                SELECT movimiento_id, COALESCE(entrada, 0) AS entrada, COALESCE(salida, 0) AS salida
                FROM donacion_movimientos
                WHERE libro_id = @Id
                ORDER BY fecha, movimiento_id",
                new { Id = libro.LibroId }, transaction)).ToList();

            var saldo = saldoInicial;
            foreach (var mov in movimientos)
            {
                saldo += mov.Entrada - mov.Salida;
                await connection.ExecuteAsync(
                    "UPDATE donacion_movimientos SET saldo = @Saldo WHERE movimiento_id = @Id",
                    new { Saldo = saldo, Id = mov.MovimientoId }, transaction);
            }

            await connection.ExecuteAsync(
                "UPDATE donacion_libros SET saldo_final = @Saldo, updated_at = CURRENT_TIMESTAMP WHERE libro_id = @Id",
                new { Saldo = saldo, Id = libro.LibroId }, transaction);

            finalAnterior = saldo;
        }
    }

    /// <summary>
    /// Crea o actualiza el movimiento ENTRADA asociado a una donación.
    /// </summary>
    public static async Task UpsertMovimientoDonacionAsync(
        DbConnection connection, DbTransaction? transaction,
        int donacionId, DateTime fecha, string descripcion, decimal entrada, string? noDocumento)
    {
        var libroId = await EnsureLibroAsync(connection, transaction, fecha.Year, fecha.Month);

        var movimientoId = await connection.QueryFirstOrDefaultAsync<int?>(
            "SELECT movimiento_id FROM donacion_movimientos WHERE donacion_id = @Id LIMIT 1",
            new { Id = donacionId }, transaction);

        if (movimientoId.HasValue)
        {
            await connection.ExecuteAsync(@"
                UPDATE donacion_movimientos SET
                    libro_id = @LibroId,
                    fecha = @Fecha,
                    descripcion = @Descripcion,
                    entrada = @Entrada,
                    salida = 0,
                    no_documento = @NoDocumento
                WHERE movimiento_id = @Id",
                new
                {
                    LibroId = libroId,
                    Fecha = fecha.Date,
                    Descripcion = descripcion,
                    Entrada = entrada,
                    NoDocumento = noDocumento,
                    Id = movimientoId.Value
                }, transaction);
        }
        else
        {
            await connection.ExecuteAsync(@"
                INSERT INTO donacion_movimientos
                    (libro_id, fecha, descripcion, firmado, no_documento, entrada, salida, saldo, donacion_id, created_at)
                VALUES
                    (@LibroId, @Fecha, @Descripcion, FALSE, @NoDocumento, @Entrada, 0, 0, @DonacionId, CURRENT_TIMESTAMP);",
                new
                {
                    LibroId = libroId,
                    Fecha = fecha.Date,
                    Descripcion = descripcion,
                    NoDocumento = noDocumento,
                    Entrada = entrada,
                    DonacionId = donacionId
                }, transaction);
        }

        await RecalcularTodosAsync(connection, transaction);
    }

    public static async Task DeleteMovimientoDonacionAsync(
        DbConnection connection, DbTransaction? transaction, int donacionId)
    {
        await connection.ExecuteAsync(
            "DELETE FROM donacion_movimientos WHERE donacion_id = @Id",
            new { Id = donacionId }, transaction);

        await RecalcularTodosAsync(connection, transaction);
    }

    /// <summary>
    /// Crea o actualiza el movimiento ENTRADA de un vehículo donado.
    /// </summary>
    public static async Task UpsertMovimientoVehiculoAsync(
        DbConnection connection, DbTransaction? transaction,
        int vehiculoId, DateTime fecha, string descripcion, decimal entrada, int? donacionId, string? noDocumento)
    {
        var libroId = await EnsureLibroAsync(connection, transaction, fecha.Year, fecha.Month);

        var movimientoId = await connection.QueryFirstOrDefaultAsync<int?>(
            "SELECT movimiento_id FROM donacion_movimientos WHERE vehiculo_id = @Id LIMIT 1",
            new { Id = vehiculoId }, transaction);

        if (movimientoId.HasValue)
        {
            await connection.ExecuteAsync(@"
                UPDATE donacion_movimientos SET
                    libro_id = @LibroId,
                    fecha = @Fecha,
                    descripcion = @Descripcion,
                    entrada = @Entrada,
                    salida = 0,
                    donacion_id = @DonacionId,
                    no_documento = @NoDocumento
                WHERE movimiento_id = @Id",
                new
                {
                    LibroId = libroId,
                    Fecha = fecha.Date,
                    Descripcion = descripcion,
                    Entrada = entrada,
                    DonacionId = donacionId,
                    NoDocumento = noDocumento,
                    Id = movimientoId.Value
                }, transaction);
        }
        else
        {
            await connection.ExecuteAsync(@"
                INSERT INTO donacion_movimientos
                    (libro_id, fecha, descripcion, firmado, no_documento, entrada, salida, saldo, donacion_id, vehiculo_id, created_at)
                VALUES
                    (@LibroId, @Fecha, @Descripcion, FALSE, @NoDocumento, @Entrada, 0, 0, @DonacionId, @VehiculoId, CURRENT_TIMESTAMP);",
                new
                {
                    LibroId = libroId,
                    Fecha = fecha.Date,
                    Descripcion = descripcion,
                    NoDocumento = noDocumento,
                    Entrada = entrada,
                    DonacionId = donacionId,
                    VehiculoId = vehiculoId
                }, transaction);
        }

        await RecalcularTodosAsync(connection, transaction);
    }

    public static async Task DeleteMovimientoVehiculoAsync(
        DbConnection connection, DbTransaction? transaction, int vehiculoId)
    {
        await connection.ExecuteAsync(
            "DELETE FROM donacion_movimientos WHERE vehiculo_id = @Id",
            new { Id = vehiculoId }, transaction);

        await RecalcularTodosAsync(connection, transaction);
    }
}
