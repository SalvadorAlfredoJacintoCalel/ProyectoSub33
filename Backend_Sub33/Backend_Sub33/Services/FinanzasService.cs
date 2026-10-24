using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Microsoft.EntityFrameworkCore;
using Backend_Sub33.Common;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs.Finanzas;

namespace Backend_Sub33.Services
{
    public class FinanzasService : IFinanzasService
    {
        private static readonly HashSet<string> TiposValidos = new(StringComparer.OrdinalIgnoreCase)
        {
            "INGRESO", "GASTO", "DONACION"
        };

        private readonly AppDbContext _context;
        private readonly ICurrentUser _currentUser;

        public FinanzasService(AppDbContext context, ICurrentUser currentUser)
        {
            _context = context;
            _currentUser = currentUser;
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

        private const string TransaccionSelect = @"
            SELECT transaccion_id,
                   tipo,
                   descripcion,
                   monto,
                   fecha,
                   referencia,
                   responsable_id,
                   responsable_nombre,
                   modulo_origen,
                   referencia_origen,
                   created_at
            FROM finanzas_transacciones";

        private static async Task<string> ResolverNombreResponsableAsync(
            System.Data.Common.DbConnection connection, Guid usuarioId)
        {
            var nombre = await connection.QueryFirstOrDefaultAsync<string?>(
                @"SELECT NULLIF(TRIM(CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido)), '')
                  FROM usuarios u
                  LEFT JOIN personal p ON p.personal_id = u.personal_id
                  WHERE u.usuario_id = @UsuarioId",
                new { UsuarioId = usuarioId });

            if (!string.IsNullOrWhiteSpace(nombre))
            {
                return nombre;
            }

            var username = await connection.QueryFirstOrDefaultAsync<string?>(
                "SELECT username FROM usuarios WHERE usuario_id = @UsuarioId",
                new { UsuarioId = usuarioId });

            return string.IsNullOrWhiteSpace(username) ? "Usuario" : username;
        }

        private async Task<ServiceResult<TransaccionDto>> InsertarAsync(
            string tipo, string descripcion, decimal monto, DateTime fecha, string? referencia,
            string? moduloOrigen, string? referenciaOrigen, Guid responsableId, string responsableNombre)
        {
            using var connection = AbrirConexion();

            var nombre = string.IsNullOrWhiteSpace(responsableNombre)
                ? await ResolverNombreResponsableAsync(connection, responsableId)
                : responsableNombre.Trim();

            var id = await connection.QuerySingleAsync<long>(@"
                INSERT INTO finanzas_transacciones
                    (tipo, descripcion, monto, fecha, referencia, responsable_id, responsable_nombre, modulo_origen, referencia_origen, created_at, updated_at)
                VALUES
                    (@Tipo, @Descripcion, @Monto, @Fecha, @Referencia, @ResponsableId, @ResponsableNombre, @ModuloOrigen, @ReferenciaOrigen, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING transaccion_id;",
                new
                {
                    Tipo = tipo,
                    Descripcion = descripcion,
                    Monto = monto,
                    Fecha = fecha.Date,
                    Referencia = referencia,
                    ResponsableId = responsableId,
                    ResponsableNombre = nombre,
                    ModuloOrigen = moduloOrigen,
                    ReferenciaOrigen = referenciaOrigen
                });

            return await ObtenerPorIdAsync(id);
        }

        public async Task<ServiceResult<TransaccionListResponseDto>> ListarAsync(TransaccionFiltrosDto filtros)
        {
            try
            {
                using var connection = AbrirConexion();

                var where = new List<string> { "1=1" };
                var parameters = new DynamicParameters();

                if (!string.IsNullOrWhiteSpace(filtros.Tipo))
                {
                    where.Add("tipo = @Tipo");
                    parameters.Add("Tipo", filtros.Tipo);
                }

                if (filtros.FechaDesde.HasValue)
                {
                    where.Add("fecha >= @FechaDesde");
                    parameters.Add("FechaDesde", filtros.FechaDesde.Value.Date);
                }

                if (filtros.FechaHasta.HasValue)
                {
                    where.Add("fecha <= @FechaHasta");
                    parameters.Add("FechaHasta", filtros.FechaHasta.Value.Date);
                }

                if (!string.IsNullOrWhiteSpace(filtros.Busqueda))
                {
                    where.Add("(descripcion ILIKE @Busqueda OR referencia ILIKE @Busqueda OR responsable_nombre ILIKE @Busqueda)");
                    parameters.Add("Busqueda", $"%{filtros.Busqueda}%");
                }

                var whereClause = string.Join(" AND ", where);

                var total = await connection.ExecuteScalarAsync<int>(
                    $"SELECT COUNT(*) FROM finanzas_transacciones WHERE {whereClause}", parameters);

                var pagina = Math.Max(1, filtros.Pagina);
                var tamanio = Math.Clamp(filtros.TamanoPagina, 1, 100);
                var offset = (pagina - 1) * tamanio;

                var sql = $"{TransaccionSelect} WHERE {whereClause} ORDER BY fecha DESC, transaccion_id DESC LIMIT @Tamano OFFSET @Offset";
                parameters.Add("Tamano", tamanio);
                parameters.Add("Offset", offset);

                var items = (await connection.QueryAsync<TransaccionDto>(sql, parameters)).ToList();

                var resultado = new TransaccionListResponseDto
                {
                    Items = items,
                    TotalItems = total,
                    PaginaActual = pagina,
                    TamanoPagina = tamanio,
                    TotalPaginas = (int)Math.Ceiling(total / (double)tamanio)
                };

                return ServiceResult<TransaccionListResponseDto>.Success(resultado);
            }
            catch (Exception ex)
            {
                return ServiceResult<TransaccionListResponseDto>.Internal($"Error al listar transacciones: {ex.Message}");
            }
        }

        public async Task<ServiceResult<TransaccionDto>> ObtenerPorIdAsync(long id)
        {
            try
            {
                using var connection = AbrirConexion();
                var transaccion = await connection.QueryFirstOrDefaultAsync<TransaccionDto>(
                    $"{TransaccionSelect} WHERE transaccion_id = @Id", new { Id = id });

                if (transaccion == null)
                {
                    return ServiceResult<TransaccionDto>.NotFound("Transacción no encontrada.");
                }

                return ServiceResult<TransaccionDto>.Success(transaccion);
            }
            catch (Exception ex)
            {
                return ServiceResult<TransaccionDto>.Internal($"Error al obtener transacción: {ex.Message}");
            }
        }

        public async Task<ServiceResult<ResumenFinancieroDto>> ObtenerResumenAsync(DateTime? desde, DateTime? hasta)
        {
            try
            {
                using var connection = AbrirConexion();

                var where = new List<string> { "1=1" };
                var parameters = new DynamicParameters();

                if (desde.HasValue)
                {
                    where.Add("fecha >= @Desde");
                    parameters.Add("Desde", desde.Value.Date);
                }

                if (hasta.HasValue)
                {
                    where.Add("fecha <= @Hasta");
                    parameters.Add("Hasta", hasta.Value.Date);
                }

                var whereClause = string.Join(" AND ", where);

                var resumen = await connection.QueryFirstOrDefaultAsync<ResumenFinancieroDto>(
                    $@"SELECT
                          COALESCE(SUM(CASE WHEN tipo = 'INGRESO'  THEN monto ELSE 0 END), 0) AS total_ingresos,
                          COALESCE(SUM(CASE WHEN tipo = 'GASTO'    THEN monto ELSE 0 END), 0) AS total_gastos,
                          COALESCE(SUM(CASE WHEN tipo = 'DONACION' THEN monto ELSE 0 END), 0) AS total_donaciones
                       FROM finanzas_transacciones
                       WHERE {whereClause}", parameters);

                resumen ??= new ResumenFinancieroDto();
                resumen.Balance = resumen.TotalIngresos + resumen.TotalDonaciones - resumen.TotalGastos;

                return ServiceResult<ResumenFinancieroDto>.Success(resumen);
            }
            catch (Exception ex)
            {
                return ServiceResult<ResumenFinancieroDto>.Internal($"Error al obtener resumen financiero: {ex.Message}");
            }
        }

        public async Task<ServiceResult<TransaccionDto>> CrearTransaccionAsync(TransaccionCreateDto dto)
        {
            if (!TiposValidos.Contains(dto.Tipo))
            {
                return ServiceResult<TransaccionDto>.BadRequest("El tipo de transacción no es válido.");
            }

            if (dto.Monto <= 0)
            {
                return ServiceResult<TransaccionDto>.BadRequest("El monto debe ser mayor a cero.");
            }

            if (string.IsNullOrWhiteSpace(dto.Descripcion))
            {
                return ServiceResult<TransaccionDto>.BadRequest("La descripción es obligatoria.");
            }

            try
            {
                var responsableId = _currentUser.UsuarioId;
                if (responsableId == Guid.Empty)
                {
                    return ServiceResult<TransaccionDto>.Forbidden("Usuario no autenticado.");
                }

                return await InsertarAsync(
                    dto.Tipo.ToUpperInvariant(),
                    dto.Descripcion.Trim(),
                    dto.Monto,
                    dto.Fecha ?? DateTime.Today,
                    string.IsNullOrWhiteSpace(dto.Referencia) ? null : dto.Referencia.Trim(),
                    string.IsNullOrWhiteSpace(dto.ModuloOrigen) ? "MANUAL" : dto.ModuloOrigen.Trim(),
                    dto.ReferenciaOrigen,
                    responsableId,
                    string.Empty);
            }
            catch (Exception ex)
            {
                return ServiceResult<TransaccionDto>.Internal($"Error al registrar transacción: {ex.Message}");
            }
        }

        public async Task<ServiceResult<TransaccionDto>> ActualizarTransaccionAsync(long id, TransaccionUpdateDto dto)
        {
            if (!TiposValidos.Contains(dto.Tipo))
            {
                return ServiceResult<TransaccionDto>.BadRequest("El tipo de transacción no es válido.");
            }

            if (dto.Monto <= 0)
            {
                return ServiceResult<TransaccionDto>.BadRequest("El monto debe ser mayor a cero.");
            }

            if (string.IsNullOrWhiteSpace(dto.Descripcion))
            {
                return ServiceResult<TransaccionDto>.BadRequest("La descripción es obligatoria.");
            }

            try
            {
                using var connection = AbrirConexion();

                var existe = await connection.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM finanzas_transacciones WHERE transaccion_id = @Id", new { Id = id });
                if (existe == 0)
                {
                    return ServiceResult<TransaccionDto>.NotFound("Transacción no encontrada.");
                }

                await connection.ExecuteAsync(@"
                    UPDATE finanzas_transacciones SET
                        tipo = @Tipo,
                        descripcion = @Descripcion,
                        monto = @Monto,
                        fecha = COALESCE(@Fecha, fecha),
                        referencia = @Referencia,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE transaccion_id = @Id",
                    new
                    {
                        Id = id,
                        Tipo = dto.Tipo.ToUpperInvariant(),
                        Descripcion = dto.Descripcion.Trim(),
                        Monto = dto.Monto,
                        Fecha = dto.Fecha?.Date,
                        Referencia = string.IsNullOrWhiteSpace(dto.Referencia) ? null : dto.Referencia.Trim()
                    });

                return await ObtenerPorIdAsync(id);
            }
            catch (Exception ex)
            {
                return ServiceResult<TransaccionDto>.Internal($"Error al actualizar transacción: {ex.Message}");
            }
        }

        public async Task<ServiceResult> EliminarTransaccionAsync(long id)
        {
            try
            {
                using var connection = AbrirConexion();

                var existe = await connection.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM finanzas_transacciones WHERE transaccion_id = @Id", new { Id = id });
                if (existe == 0)
                {
                    return ServiceResult.NotFound("Transacción no encontrada.");
                }

                await connection.ExecuteAsync(
                    "DELETE FROM finanzas_transacciones WHERE transaccion_id = @Id", new { Id = id });

                return ServiceResult.Success();
            }
            catch (Exception ex)
            {
                return ServiceResult.Internal($"Error al eliminar transacción: {ex.Message}");
            }
        }

        public async Task<ServiceResult<TransaccionDto>> CrearGastoDesdeMantenimientoAsync(
            int mantenimientoId, decimal costo, string descripcion, Guid responsableId, string responsableNombre)
        {
            if (costo <= 0)
            {
                return ServiceResult<TransaccionDto>.BadRequest("El costo del mantenimiento debe ser mayor a cero.");
            }

            return await CrearAutoAsync("GASTO", "MANTENIMIENTO", mantenimientoId.ToString(),
                costo, descripcion, responsableId, responsableNombre);
        }

        public async Task<ServiceResult<TransaccionDto>> CrearIngresoDesdeDonacionAsync(
            int donacionId, decimal monto, string descripcion, Guid responsableId, string responsableNombre)
        {
            if (monto <= 0)
            {
                return ServiceResult<TransaccionDto>.BadRequest("El monto de la donación debe ser mayor a cero.");
            }

            return await CrearAutoAsync("DONACION", "DONACIONES", donacionId.ToString(),
                monto, descripcion, responsableId, responsableNombre);
        }

        private async Task<ServiceResult<TransaccionDto>> CrearAutoAsync(
            string tipo, string moduloOrigen, string referenciaOrigen, decimal monto,
            string descripcion, Guid responsableId, string responsableNombre)
        {
            try
            {
                using var connection = AbrirConexion();

                var existente = await connection.QueryFirstOrDefaultAsync<TransaccionDto>(
                    $@"{TransaccionSelect}
                       WHERE modulo_origen = @ModuloOrigen AND referencia_origen = @ReferenciaOrigen AND tipo = @Tipo
                       LIMIT 1",
                    new { ModuloOrigen = moduloOrigen, ReferenciaOrigen = referenciaOrigen, Tipo = tipo });

                if (existente != null)
                {
                    return ServiceResult<TransaccionDto>.Success(existente);
                }

                if (responsableId == Guid.Empty)
                {
                    responsableId = _currentUser.UsuarioId;
                }

                return await InsertarAsync(
                    tipo,
                    string.IsNullOrWhiteSpace(descripcion) ? $"{moduloOrigen} #{referenciaOrigen}" : descripcion.Trim(),
                    monto,
                    DateTime.Today,
                    referenciaOrigen,
                    moduloOrigen,
                    referenciaOrigen,
                    responsableId,
                    responsableNombre);
            }
            catch (Exception ex)
            {
                return ServiceResult<TransaccionDto>.Internal($"Error al registrar transacción automática: {ex.Message}");
            }
        }
    }
}
