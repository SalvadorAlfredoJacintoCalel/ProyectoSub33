using System;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Microsoft.EntityFrameworkCore;
using Backend_Sub33.Common;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs.Dashboard;

namespace Backend_Sub33.Services;

public interface IDashboardService
{
    Task<ServiceResult<DashboardResumenDto>> ObtenerResumenAsync();
}

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    private System.Data.Common.DbConnection AbrirConexion()
    {
        var connection = _context.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            connection.Open();
        }
        return connection;
    }

    private static readonly string[] DiasSemana = { "Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb" };

    public async Task<ServiceResult<DashboardResumenDto>> ObtenerResumenAsync()
    {
        try
        {
            using var connection = AbrirConexion();

            var inicioMes = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
            var inicioMesAnterior = inicioMes.AddMonths(-1);
            var finMesAnterior = inicioMes;

            // 1. Emergencias del mes actual y del mes anterior
            var emergenciasMes = await connection.ExecuteScalarAsync<int>(
                @"SELECT COUNT(*) FROM emergencias_servicios
                  WHERE estado <> 'Inactivo' AND fecha >= @Inicio AND fecha < @Fin",
                new { Inicio = inicioMes, Fin = inicioMes.AddMonths(1) });

            var emergenciasMesAnterior = await connection.ExecuteScalarAsync<int>(
                @"SELECT COUNT(*) FROM emergencias_servicios
                  WHERE estado <> 'Inactivo' AND fecha >= @Inicio AND fecha < @Fin",
                new { Inicio = inicioMesAnterior, Fin = finMesAnterior });

            // 2. Personal
            var personalTotal = await connection.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM personal");
            var personalActivos = await connection.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM personal WHERE estado = TRUE");
            var personalInactivos = personalTotal - personalActivos;

            // 3. Vehículos
            var vehiculosTotal = await connection.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM vehiculos");
            var vehiculosOperativos = await connection.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM vehiculos WHERE estado = 'Activo' AND estado_operativo = 'Operativa'");

            // 4. Donaciones del mes actual y anterior
            var donacionesMes = await connection.ExecuteScalarAsync<decimal>(
                @"SELECT COALESCE(SUM(monto), 0) FROM donaciones
                  WHERE fecha >= @Inicio AND fecha < @Fin",
                new { Inicio = inicioMes, Fin = inicioMes.AddMonths(1) });

            var donacionesMesAnterior = await connection.ExecuteScalarAsync<decimal>(
                @"SELECT COALESCE(SUM(monto), 0) FROM donaciones
                  WHERE fecha >= @Inicio AND fecha < @Fin",
                new { Inicio = inicioMesAnterior, Fin = finMesAnterior });

            // 5. Incidentes por tipo de asistencia
            var incidentesPorTipo = (await connection.QueryAsync<ConteoTipoDto>(
                @"SELECT COALESCE(sta.tipo_asistencia, 'Otros') AS tipo, COUNT(DISTINCT e.servicio_id) AS cantidad
                  FROM emergencias_servicios e
                  LEFT JOIN servicio_tipos_asistencia sta ON sta.servicio_id = e.servicio_id
                  WHERE e.estado <> 'Inactivo'
                  GROUP BY sta.tipo_asistencia
                  ORDER BY cantidad DESC")).ToList();

            // 6. Emergencias de los últimos 7 días (semana a semana)
            var filasSemana = (await connection.QueryAsync<(DateTime Fecha, int Cantidad)>(
                @"SELECT d.day::date AS fecha, COUNT(e.servicio_id) AS cantidad
                  FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, '1 day'::interval) AS d(day)
                  LEFT JOIN emergencias_servicios e ON e.fecha::date = d.day::date AND e.estado <> 'Inactivo'
                  GROUP BY d.day
                  ORDER BY d.day")).ToList();

            var semana = filasSemana
                .Select(f => new ConteoSemanaDto
                {
                    Dia = DiasSemana[(int)f.Fecha.DayOfWeek],
                    Cantidad = f.Cantidad
                })
                .ToList();

            // 7. Últimos servicios
            var ultimosServicios = (await connection.QueryAsync<UltimoServicioDto>(
                @"SELECT e.numero_incidente,
                         e.fecha,
                         to_char(e.hora_salida, 'HH24:MI') AS hora,
                         COALESCE(
                             (SELECT sta.tipo_asistencia
                              FROM servicio_tipos_asistencia sta
                              WHERE sta.servicio_id = e.servicio_id
                              LIMIT 1),
                             'Otros'
                         ) AS tipo,
                         e.paciente,
                         e.ubicacion,
                         COALESCE(e.unidad_asignada_nombre, '') AS unidad
                  FROM emergencias_servicios e
                  WHERE e.estado <> 'Inactivo'
                  ORDER BY e.fecha DESC, e.servicio_id DESC
                  LIMIT 8")).ToList();

            var resumen = new DashboardResumenDto
            {
                EmergenciasMes = emergenciasMes,
                EmergenciasMesAnterior = emergenciasMesAnterior,
                PersonalTotal = personalTotal,
                PersonalActivos = personalActivos,
                PersonalInactivos = personalInactivos,
                VehiculosTotal = vehiculosTotal,
                VehiculosOperativos = vehiculosOperativos,
                DonacionesMes = donacionesMes,
                DonacionesMesAnterior = donacionesMesAnterior,
                IncidentesPorTipo = incidentesPorTipo,
                Semana = semana,
                UltimosServicios = ultimosServicios
            };

            return ServiceResult<DashboardResumenDto>.Success(resumen);
        }
        catch (Exception ex)
        {
            return ServiceResult<DashboardResumenDto>.Internal($"Error al obtener el resumen del dashboard: {ex.Message}");
        }
    }
}
