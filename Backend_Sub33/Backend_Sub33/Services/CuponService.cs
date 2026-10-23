using System.Data;
using System.Data.Common;
using Dapper;
using Microsoft.EntityFrameworkCore;
using Backend_Sub33.Common;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs.Vehiculos;

namespace Backend_Sub33.Services;

public class CuponService : ICuponService
{
    private readonly AppDbContext _context;

    public CuponService(AppDbContext context)
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

    private sealed class PeriodoRow
    {
        public int PeriodoId { get; set; }
        public int Anio { get; set; }
        public int Mes { get; set; }
        public decimal SaldoInicial { get; set; }
        public decimal ValorCuponDefault { get; set; }
        public int TotalRecibidos { get; set; }
    }

    private sealed class CuponRow
    {
        public int RegistroId { get; set; }
        public long CuponDel { get; set; }
        public long CuponAl { get; set; }
        public decimal ValorCupon { get; set; }
    }

    private sealed class CuponActualRow
    {
        public int PeriodoId { get; set; }
        public string? FirmaBase64 { get; set; }
    }

    private const string CuponSelect = @"
        SELECT c.registro_id, p.periodo_id, p.anio, p.mes, c.vehiculo_id,
               v.codigo AS vehiculo_codigo, v.placa AS placas, t.nombre AS tipo_unidad,
               c.fecha, c.responsable, c.kilometraje, c.galonaje, c.comision_no,
               c.gasolinera_id, g.nombre AS gasolinera_nombre, c.cupon_del, c.cupon_al,
               c.total_cupones, c.valor_cupon, c.haber,
               (c.firma_base64 IS NOT NULL) AS firmado, c.firma_base64, c.saldo,
               c.observaciones
        FROM vehiculo_cupones c
        INNER JOIN vehiculo_cupones_periodos p ON p.periodo_id = c.periodo_id
        LEFT JOIN vehiculos v ON v.vehiculo_id = c.vehiculo_id
        LEFT JOIN cat_tipos_vehiculo t ON t.tipo_vehiculo_id = v.tipo_id
        LEFT JOIN cat_gasolineras g ON g.gasolinera_id = c.gasolinera_id";

    // ── Período ──────────────────────────────────────────────────────────────
    public async Task<ServiceResult<CuponPeriodoDto>> GetPeriodoAsync(int anio, int mes)
    {
        if (anio < 2000 || anio > 2100 || mes < 1 || mes > 12)
        {
            return ServiceResult<CuponPeriodoDto>.BadRequest("Período inválido.");
        }

        using var connection = AbrirConexion();
        using var transaction = connection.BeginTransaction();

        try
        {
            var periodoId = await EnsurePeriodoAsync(connection, transaction, anio, mes);
            await RecalcularTodosAsync(connection, transaction);
            transaction.Commit();

            return await LeerPeriodoAsync(connection, periodoId);
        }
        catch (Exception ex)
        {
            try { transaction.Rollback(); } catch { }
            return ServiceResult<CuponPeriodoDto>.Internal($"Error al obtener el período: {ex.Message}");
        }
    }

    public async Task<ServiceResult<CuponPeriodoDto>> SavePeriodoAsync(CuponPeriodoCreateDto dto)
    {
        if (dto.Anio < 2000 || dto.Anio > 2100 || dto.Mes < 1 || dto.Mes > 12)
        {
            return ServiceResult<CuponPeriodoDto>.BadRequest("Período inválido.");
        }

        if (dto.TotalRecibidos < 0 || dto.ValorCuponDefault < 0)
        {
            return ServiceResult<CuponPeriodoDto>.BadRequest("Los cupones recibidos y el valor no pueden ser negativos.");
        }

        var totalRecibidos = dto.TotalRecibidos;
        if (dto.CuponInicialDel.HasValue && dto.CuponInicialAl.HasValue)
        {
            if (dto.CuponInicialAl.Value < dto.CuponInicialDel.Value)
            {
                return ServiceResult<CuponPeriodoDto>.BadRequest("El rango de cupones recibidos es inválido.");
            }

            if (totalRecibidos == 0)
            {
                var calculado = dto.CuponInicialAl.Value - dto.CuponInicialDel.Value + 1;
                totalRecibidos = calculado > int.MaxValue ? 0 : (int)calculado;
            }
        }

        using var connection = AbrirConexion();
        using var transaction = connection.BeginTransaction();

        try
        {
            var periodoId = await EnsurePeriodoAsync(connection, transaction, dto.Anio, dto.Mes);

            await connection.ExecuteAsync(@"
                UPDATE vehiculo_cupones_periodos SET
                    cupon_inicial_del = @Del,
                    cupon_inicial_al = @Al,
                    total_recibidos = @Total,
                    comision_realizada = @ComisionRealizada,
                    valor_cupon_default = @Valor,
                    haber_inicial = @HaberInicial,
                    notas = @Notas,
                    elaborado_por = @ElaboradoPor,
                    jefe_abastecimientos = @JefeAbastecimientos,
                    jefe_33_cia = @Jefe33Cia,
                    director = @Director,
                    updated_at = CURRENT_TIMESTAMP
                WHERE periodo_id = @Id",
                new
                {
                    Id = periodoId,
                    Del = dto.CuponInicialDel,
                    Al = dto.CuponInicialAl,
                    Total = totalRecibidos,
                    ComisionRealizada = dto.ComisionRealizada,
                    Valor = dto.ValorCuponDefault,
                    HaberInicial = totalRecibidos * dto.ValorCuponDefault,
                    Notas = string.IsNullOrWhiteSpace(dto.Notas) ? null : dto.Notas.Trim(),
                    ElaboradoPor = Limpiar(dto.ElaboradoPor),
                    JefeAbastecimientos = Limpiar(dto.JefeAbastecimientos),
                    Jefe33Cia = Limpiar(dto.Jefe33Cia),
                    Director = Limpiar(dto.Director)
                }, transaction);

            await RecalcularTodosAsync(connection, transaction);
            transaction.Commit();

            return await LeerPeriodoAsync(connection, periodoId);
        }
        catch (Exception ex)
        {
            try { transaction.Rollback(); } catch { }
            return ServiceResult<CuponPeriodoDto>.Internal($"Error al guardar el período: {ex.Message}");
        }
    }

    // ── Registros de cupones ─────────────────────────────────────────────────
    public async Task<ServiceResult<VehiculoCuponDto>> CreateAsync(CuponCreateDto dto)
    {
        var validacion = ValidarCupon(dto.Anio, dto.Mes, dto.Responsable, dto.Fecha,
            dto.CuponDel, dto.CuponAl, dto.ValorCupon);
        if (validacion != null)
        {
            return ServiceResult<VehiculoCuponDto>.BadRequest(validacion);
        }

        using var connection = AbrirConexion();
        using var transaction = connection.BeginTransaction();

        try
        {
            var periodoId = await EnsurePeriodoAsync(connection, transaction, dto.Anio, dto.Mes);

            var solapado = await connection.ExecuteScalarAsync<bool>(@"
                SELECT EXISTS(
                    SELECT 1 FROM vehiculo_cupones
                    WHERE periodo_id = @PeriodoId
                      AND cupon_del <= @Al AND cupon_al >= @Del)",
                new { PeriodoId = periodoId, Del = dto.CuponDel, Al = dto.CuponAl }, transaction);
            if (solapado)
            {
                return ServiceResult<VehiculoCuponDto>.Conflict("El rango de cupones se solapa con otro registro del mismo mes.");
            }

            var total = CalcularTotal(dto.CuponDel, dto.CuponAl);
            var comisionNo = await connection.QuerySingleAsync<int>(@"
                SELECT COALESCE(MAX(comision_no), 0) + 1
                FROM vehiculo_cupones WHERE periodo_id = @PeriodoId",
                new { PeriodoId = periodoId }, transaction);
            var firmaBase64 = NormalizarFirma(dto.FirmaBase64);

            var id = await connection.QuerySingleAsync<int>(@"
                INSERT INTO vehiculo_cupones
                    (periodo_id, vehiculo_id, fecha, responsable, kilometraje, galonaje,
                     comision_no, gasolinera_id, cupon_del, cupon_al, total_cupones,
                     valor_cupon, haber, firmado, firma_base64, saldo, observaciones, created_at)
                VALUES
                    (@PeriodoId, @VehiculoId, @Fecha, @Responsable, @Kilometraje, @Galonaje,
                     @ComisionNo, @GasolineraId, @CuponDel, @CuponAl, @Total,
                     @ValorCupon, @Haber, @Firmado, @FirmaBase64, 0, @Observaciones, CURRENT_TIMESTAMP)
                RETURNING registro_id;",
                new
                {
                    PeriodoId = periodoId,
                    dto.VehiculoId,
                    Fecha = dto.Fecha.Date,
                    Responsable = dto.Responsable.Trim(),
                    dto.Kilometraje,
                    dto.Galonaje,
                    ComisionNo = comisionNo,
                    dto.GasolineraId,
                    dto.CuponDel,
                    dto.CuponAl,
                    Total = total,
                    dto.ValorCupon,
                    Haber = total * dto.ValorCupon,
                    Firmado = firmaBase64 != null,
                    FirmaBase64 = firmaBase64,
                    Observaciones = string.IsNullOrWhiteSpace(dto.Observaciones) ? null : dto.Observaciones.Trim()
                }, transaction);

            await RecalcularTodosAsync(connection, transaction);
            transaction.Commit();

            var creado = await connection.QueryFirstOrDefaultAsync<VehiculoCuponDto>(
                $"{CuponSelect} WHERE c.registro_id = @Id", new { Id = id });

            return ServiceResult<VehiculoCuponDto>.Success(creado!);
        }
        catch (Exception ex)
        {
            try { transaction.Rollback(); } catch { }
            return ServiceResult<VehiculoCuponDto>.Internal($"Error al registrar el cupón: {ex.Message}");
        }
    }

    public async Task<ServiceResult<VehiculoCuponDto>> UpdateAsync(int id, CuponUpdateDto dto)
    {
        var validacion = ValidarCupon(0, 1, dto.Responsable, dto.Fecha,
            dto.CuponDel, dto.CuponAl, dto.ValorCupon);
        if (validacion != null)
        {
            return ServiceResult<VehiculoCuponDto>.BadRequest(validacion);
        }

        using var connection = AbrirConexion();
        using var transaction = connection.BeginTransaction();

        try
        {
            var actual = await connection.QueryFirstOrDefaultAsync<CuponActualRow>(
                "SELECT periodo_id, firma_base64 FROM vehiculo_cupones WHERE registro_id = @Id",
                new { Id = id }, transaction);
            if (actual == null)
            {
                return ServiceResult<VehiculoCuponDto>.NotFound("Registro de cupón no encontrado.");
            }

            var solapado = await connection.ExecuteScalarAsync<bool>(@"
                SELECT EXISTS(
                    SELECT 1 FROM vehiculo_cupones
                    WHERE periodo_id = @PeriodoId AND registro_id <> @Id
                      AND cupon_del <= @Al AND cupon_al >= @Del)",
                new { PeriodoId = actual.PeriodoId, Id = id, Del = dto.CuponDel, Al = dto.CuponAl }, transaction);
            if (solapado)
            {
                return ServiceResult<VehiculoCuponDto>.Conflict("El rango de cupones se solapa con otro registro del mismo mes.");
            }

            var total = CalcularTotal(dto.CuponDel, dto.CuponAl);
            var firmaBase64 = NormalizarFirma(dto.FirmaBase64) ?? actual.FirmaBase64;

            await connection.ExecuteAsync(@"
                UPDATE vehiculo_cupones SET
                    vehiculo_id = @VehiculoId,
                    fecha = @Fecha,
                    responsable = @Responsable,
                    kilometraje = @Kilometraje,
                    galonaje = @Galonaje,
                    gasolinera_id = @GasolineraId,
                    cupon_del = @CuponDel,
                    cupon_al = @CuponAl,
                    total_cupones = @Total,
                    valor_cupon = @ValorCupon,
                    haber = @Haber,
                    firmado = @Firmado,
                    firma_base64 = @FirmaBase64,
                    observaciones = @Observaciones
                WHERE registro_id = @Id",
                new
                {
                    Id = id,
                    dto.VehiculoId,
                    Fecha = dto.Fecha.Date,
                    Responsable = dto.Responsable.Trim(),
                    dto.Kilometraje,
                    dto.Galonaje,
                    dto.GasolineraId,
                    dto.CuponDel,
                    dto.CuponAl,
                    Total = total,
                    dto.ValorCupon,
                    Haber = total * dto.ValorCupon,
                    Firmado = firmaBase64 != null,
                    FirmaBase64 = firmaBase64,
                    Observaciones = string.IsNullOrWhiteSpace(dto.Observaciones) ? null : dto.Observaciones.Trim()
                }, transaction);

            await RecalcularTodosAsync(connection, transaction);
            transaction.Commit();

            var actualizado = await connection.QueryFirstOrDefaultAsync<VehiculoCuponDto>(
                $"{CuponSelect} WHERE c.registro_id = @Id", new { Id = id });

            return ServiceResult<VehiculoCuponDto>.Success(actualizado!);
        }
        catch (Exception ex)
        {
            try { transaction.Rollback(); } catch { }
            return ServiceResult<VehiculoCuponDto>.Internal($"Error al actualizar el cupón: {ex.Message}");
        }
    }

    public async Task<ServiceResult> DeleteAsync(int id)
    {
        using var connection = AbrirConexion();
        using var transaction = connection.BeginTransaction();

        try
        {
            var afectados = await connection.ExecuteAsync(
                "DELETE FROM vehiculo_cupones WHERE registro_id = @Id",
                new { Id = id }, transaction);
            if (afectados == 0)
            {
                return ServiceResult.NotFound("Registro de cupón no encontrado.");
            }

            await RecalcularTodosAsync(connection, transaction);
            transaction.Commit();
            return ServiceResult.Success();
        }
        catch (Exception ex)
        {
            try { transaction.Rollback(); } catch { }
            return ServiceResult.Internal($"Error al eliminar el cupón: {ex.Message}");
        }
    }

    // ── Cálculos ─────────────────────────────────────────────────────────────
    private static async Task<int> EnsurePeriodoAsync(
        DbConnection connection, DbTransaction transaction, int anio, int mes)
    {
        var id = await connection.QueryFirstOrDefaultAsync<int?>(
            "SELECT periodo_id FROM vehiculo_cupones_periodos WHERE anio = @Anio AND mes = @Mes LIMIT 1",
            new { Anio = anio, Mes = mes }, transaction);

        if (id.HasValue)
        {
            return id.Value;
        }

        return await connection.QuerySingleAsync<int>(@"
            INSERT INTO vehiculo_cupones_periodos
                (anio, mes, total_recibidos, valor_cupon_default, haber_inicial,
                 saldo_inicial, saldo_final, created_at, updated_at)
            VALUES
                (@Anio, @Mes, 0, 100, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING periodo_id;",
            new { Anio = anio, Mes = mes }, transaction);
    }

    /// <summary>
    /// Recalcula todos los meses en orden: saldo_inicial = saldo_final anterior;
    /// saldo = saldo_inicial + haber recibido - suma(haber de cada cupón).
    /// </summary>
    private static async Task RecalcularTodosAsync(DbConnection connection, DbTransaction transaction)
    {
        var periodos = (await connection.QueryAsync<PeriodoRow>(@"
            SELECT periodo_id, anio, mes, saldo_inicial, valor_cupon_default, total_recibidos
            FROM vehiculo_cupones_periodos
            ORDER BY anio, mes", transaction: transaction)).ToList();

        decimal? finalAnterior = null;

        foreach (var periodo in periodos)
        {
            var saldoInicial = finalAnterior ?? periodo.SaldoInicial;

            if (saldoInicial != periodo.SaldoInicial)
            {
                await connection.ExecuteAsync(
                    "UPDATE vehiculo_cupones_periodos SET saldo_inicial = @Saldo WHERE periodo_id = @Id",
                    new { Saldo = saldoInicial, Id = periodo.PeriodoId }, transaction);
            }

            var cupones = (await connection.QueryAsync<CuponRow>(@"
                SELECT registro_id, cupon_del, cupon_al, valor_cupon
                FROM vehiculo_cupones
                WHERE periodo_id = @Id
                ORDER BY fecha, registro_id",
                new { Id = periodo.PeriodoId }, transaction)).ToList();

            var saldo = saldoInicial + (periodo.TotalRecibidos * periodo.ValorCuponDefault);
            foreach (var cupon in cupones)
            {
                var total = CalcularTotal(cupon.CuponDel, cupon.CuponAl);
                var haber = total * cupon.ValorCupon;
                saldo -= haber;

                await connection.ExecuteAsync(@"
                    UPDATE vehiculo_cupones SET
                        total_cupones = @Total,
                        haber = @Haber,
                        saldo = @Saldo
                    WHERE registro_id = @Id",
                    new
                    {
                        Id = cupon.RegistroId,
                        Total = total,
                        Haber = haber,
                        Saldo = saldo
                    }, transaction);
            }

            await connection.ExecuteAsync(
                "UPDATE vehiculo_cupones_periodos SET saldo_final = @Saldo, updated_at = CURRENT_TIMESTAMP WHERE periodo_id = @Id",
                new { Saldo = saldo, Id = periodo.PeriodoId }, transaction);

            finalAnterior = saldo;
        }
    }

    private static async Task<ServiceResult<CuponPeriodoDto>> LeerPeriodoAsync(
        DbConnection connection, int periodoId)
    {
        var periodo = await connection.QueryFirstOrDefaultAsync<CuponPeriodoDto>(@"
            SELECT periodo_id, anio, mes, cupon_inicial_del, cupon_inicial_al,
                   total_recibidos, comision_realizada, valor_cupon_default, haber_inicial,
                   saldo_inicial, saldo_final, notas,
                   elaborado_por, jefe_abastecimientos, jefe_33_cia, director
            FROM vehiculo_cupones_periodos WHERE periodo_id = @Id",
            new { Id = periodoId });

        if (periodo == null)
        {
            return ServiceResult<CuponPeriodoDto>.NotFound("Período no encontrado.");
        }

        periodo.Cupones = (await connection.QueryAsync<VehiculoCuponDto>(
            $"{CuponSelect} WHERE c.periodo_id = @Id ORDER BY c.fecha, c.registro_id",
            new { Id = periodoId })).ToList();

        periodo.TotalRegistros = periodo.Cupones.Count;
        periodo.TotalCuponesGastados = periodo.Cupones.Sum(c => c.TotalCupones);
        periodo.TotalHaber = periodo.Cupones.Sum(c => c.Haber);

        return ServiceResult<CuponPeriodoDto>.Success(periodo);
    }

    // ── Reporte oficial de impresión ─────────────────────────────────────────
    public async Task<ServiceResult<ReporteCuponesDto>> GetReporteImpresionAsync(int anio, int mes)
    {
        if (anio < 2000 || anio > 2100 || mes < 1 || mes > 12)
        {
            return ServiceResult<ReporteCuponesDto>.BadRequest("Período inválido.");
        }

        using var connection = AbrirConexion();
        using var transaction = connection.BeginTransaction();

        try
        {
            var periodoId = await EnsurePeriodoAsync(connection, transaction, anio, mes);
            await RecalcularTodosAsync(connection, transaction);
            transaction.Commit();

            var periodo = await connection.QueryFirstOrDefaultAsync<CuponPeriodoDto>(@"
                SELECT periodo_id, anio, mes, cupon_inicial_del, cupon_inicial_al,
                       total_recibidos, comision_realizada, valor_cupon_default, haber_inicial,
                       saldo_inicial, saldo_final, notas,
                       elaborado_por, jefe_abastecimientos, jefe_33_cia, director
                FROM vehiculo_cupones_periodos WHERE periodo_id = @Id",
                new { Id = periodoId });

            if (periodo == null)
            {
                return ServiceResult<ReporteCuponesDto>.NotFound("Período no encontrado.");
            }

            var detalle = (await connection.QueryAsync<VehiculoCuponDto>(
                $"{CuponSelect} WHERE c.periodo_id = @Id ORDER BY c.fecha, c.comision_no, c.registro_id",
                new { Id = periodoId })).ToList();

            var totalGastados = detalle.Sum(c => c.TotalCupones);
            var totalHaber = detalle.Sum(c => c.Haber);
            var saldoFinal = detalle.Count > 0 ? detalle[^1].Saldo : periodo.SaldoFinal;
            var cuponesRestantes = Math.Max(0, periodo.TotalRecibidos - totalGastados);
            var saldoParaSiguienteMes = saldoFinal;

            var reporte = new ReporteCuponesDto
            {
                Encabezado = new ReporteEncabezadoDto
                {
                    Anio = periodo.Anio,
                    Mes = periodo.Mes,
                    MesNombre = NombreMes(periodo.Mes),
                    CuponInicialDel = periodo.CuponInicialDel,
                    CuponInicialAl = periodo.CuponInicialAl,
                    TotalRecibidos = periodo.TotalRecibidos,
                    ComisionRealizada = periodo.ComisionRealizada,
                    ValorCuponDefault = periodo.ValorCuponDefault,
                    HaberInicial = periodo.HaberInicial
                },
                Detalle = detalle,
                Totales = new ReporteTotalesDto
                {
                    TotalGastados = totalGastados,
                    ValorCupon = periodo.ValorCuponDefault,
                    TotalHaber = totalHaber,
                    SaldoFinal = saldoFinal,
                    CuponesRestantes = cuponesRestantes,
                    SaldoParaSiguienteMes = saldoParaSiguienteMes
                },
                Firmas = new ReporteFirmasDto
                {
                    ElaboradoPor = new FirmaReporteDto
                    {
                        Nombre = periodo.ElaboradoPor ?? ""
                    },
                    JefeAbastecimientos = new FirmaReporteDto
                    {
                        Nombre = periodo.JefeAbastecimientos ?? ""
                    },
                    Jefe33Cia = new FirmaReporteDto
                    {
                        Nombre = periodo.Jefe33Cia ?? ""
                    },
                    Director = new FirmaReporteDto
                    {
                        Nombre = periodo.Director ?? ""
                    }
                }
            };

            return ServiceResult<ReporteCuponesDto>.Success(reporte);
        }
        catch (Exception ex)
        {
            try { transaction.Rollback(); } catch { }
            return ServiceResult<ReporteCuponesDto>.Internal($"Error al generar el reporte: {ex.Message}");
        }
    }

    private static readonly string[] NombresMeses =
    {
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    };

    private static string NombreMes(int mes)
        => mes >= 1 && mes <= 12 ? NombresMeses[mes - 1].ToUpperInvariant() : mes.ToString();

    private static string? Limpiar(string? valor)
        => string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

    private static string? NormalizarFirma(string? firma)
    {
        if (string.IsNullOrWhiteSpace(firma)) return null;
        var valor = firma.Trim();
        return valor.StartsWith("data:image/png;base64,", StringComparison.OrdinalIgnoreCase) ? valor : null;
    }

    private static int CalcularTotal(long del, long al)
    {
        var total = al - del + 1;
        if (total < 0) return 0;
        return total > int.MaxValue ? int.MaxValue : (int)total;
    }

    private static string? ValidarCupon(
        int anio, int mes, string? responsable, DateTime fecha,
        long del, long al, decimal valor)
    {
        if (responsable == null || string.IsNullOrWhiteSpace(responsable)) return "El responsable es obligatorio.";
        if (fecha == default) return "La fecha es obligatoria.";
        if (del <= 0 || al <= 0) return "Los números de cupón deben ser mayores a cero.";
        if (al < del) return "El cupón 'Al' no puede ser menor que 'Del'.";
        if (valor <= 0) return "El valor del cupón debe ser mayor a cero.";
        if (anio != 0 && (anio < 2000 || anio > 2100 || mes < 1 || mes > 12)) return "Período inválido.";
        return null;
    }
}
