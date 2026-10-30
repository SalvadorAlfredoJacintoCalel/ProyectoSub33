using System.Data;
using System.Data.Common;
using Dapper;
using Microsoft.EntityFrameworkCore;
using Backend_Sub33.Common;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs.Vehiculos;

namespace Backend_Sub33.Services;

public class VehiculoService : IVehiculoService
{
    private static readonly HashSet<string> EstadosOperativos = new(StringComparer.OrdinalIgnoreCase)
    {
        "Operativa", "En Servicio", "Mantenimiento", "Fuera de Servicio"
    };

    private static readonly HashSet<string> Origenes = new(StringComparer.OrdinalIgnoreCase)
    {
        "Compra Propia", "Donado"
    };

    private static readonly HashSet<string> EstadosRegistro = new(StringComparer.OrdinalIgnoreCase)
    {
        "Activo", "Inactivo"
    };

    private static readonly HashSet<string> EstadosMantenimiento = new(StringComparer.OrdinalIgnoreCase)
    {
        "En proceso", "Finalizado"
    };

    private readonly AppDbContext _context;

    public VehiculoService(AppDbContext context)
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

    private sealed class VinculosRow
    {
        public int? DonacionId { get; set; }
        public int? ItemId { get; set; }
    }

    private const string VehiculoSelect = @"
        SELECT v.vehiculo_id, v.codigo, v.tipo_id, t.nombre AS tipo_nombre,
               v.marca, v.modelo, v.anio, v.color, v.placa, v.chasis, v.motor,
               v.no_unidad, v.combustible, v.capacidad_tanque, v.kilometraje,
               v.condicion_llantas, v.volante_direccion, v.seguro_hasta, v.estado_operativo,
               v.origen, v.donacion_id, v.estado, v.valor_unitario, v.ubicacion,
               v.created_at, v.updated_at,
               d.donante, d.no_recibo AS no_recibo_donacion,
               i.item_id, i.fecha_baja
        FROM vehiculos v
        LEFT JOIN cat_tipos_vehiculo t ON t.tipo_vehiculo_id = v.tipo_id
        LEFT JOIN donaciones d ON d.donacion_id = v.donacion_id
        LEFT JOIN inventario_items i ON i.vehiculo_id = v.vehiculo_id";

    private const string CuponSelect = @"
        SELECT c.registro_id, p.periodo_id, p.anio, p.mes, c.vehiculo_id,
               v.codigo AS vehiculo_codigo, v.placa AS placas,
               t.nombre AS tipo_unidad, c.fecha, c.responsable, c.kilometraje,
               c.galonaje, c.comision_no, c.gasolinera_id,
               g.nombre AS gasolinera_nombre, c.cupon_del, c.cupon_al,
               c.total_cupones, c.valor_cupon, c.haber, c.firmado, c.saldo,
               c.observaciones
        FROM vehiculo_cupones c
        INNER JOIN vehiculo_cupones_periodos p ON p.periodo_id = c.periodo_id
        LEFT JOIN vehiculos v ON v.vehiculo_id = c.vehiculo_id
        LEFT JOIN cat_tipos_vehiculo t ON t.tipo_vehiculo_id = v.tipo_id
        LEFT JOIN cat_gasolineras g ON g.gasolinera_id = c.gasolinera_id";

    // ── Listado ──────────────────────────────────────────────────────────────
    public async Task<ServiceResult<VehiculoResumenDto>> GetResumenAsync()
    {
        try
        {
            using var connection = AbrirConexion();

            var resumen = await connection.QueryFirstOrDefaultAsync<VehiculoResumenDto>(@"
                SELECT
                    COUNT(*)::int AS total_unidades,
                    COUNT(*) FILTER (WHERE estado = 'Activo' AND estado_operativo IN ('Operativa', 'En Servicio'))::int AS operativas,
                    COUNT(*) FILTER (WHERE estado = 'Activo' AND estado_operativo = 'Mantenimiento')::int AS en_mantenimiento,
                    COUNT(*) FILTER (WHERE estado = 'Activo' AND origen = 'Donado')::int AS donados,
                    COUNT(*) FILTER (WHERE estado = 'Inactivo')::int AS bajas,
                    COALESCE(SUM(valor_unitario) FILTER (WHERE estado = 'Activo'), 0)::numeric(12,2) AS valor_flota
                FROM vehiculos");

            return ServiceResult<VehiculoResumenDto>.Success(resumen ?? new VehiculoResumenDto());
        }
        catch (Exception ex)
        {
            return ServiceResult<VehiculoResumenDto>.Internal($"Error al obtener resumen de vehículos: {ex.Message}");
        }
    }

    public async Task<ServiceResult<VehiculoListResponseDto>> GetPaginadoAsync(VehiculoFiltrosDto filtros)
    {
        try
        {
            var pagina = filtros.Pagina < 1 ? 1 : filtros.Pagina;
            var tamano = filtros.TamanoPagina is < 1 or > 500 ? 10 : filtros.TamanoPagina;

            var where = new List<string>();
            var parameters = new DynamicParameters();

            if (!string.IsNullOrWhiteSpace(filtros.Busqueda))
            {
                where.Add(@"(
                    v.codigo ILIKE @Busqueda OR v.placa ILIKE @Busqueda OR
                    v.marca ILIKE @Busqueda OR v.modelo ILIKE @Busqueda OR
                    v.chasis ILIKE @Busqueda OR v.motor ILIKE @Busqueda OR
                    t.nombre ILIKE @Busqueda)");
                parameters.Add("Busqueda", $"%{filtros.Busqueda.Trim()}%");
            }

            if (filtros.TipoId.HasValue)
            {
                where.Add("v.tipo_id = @TipoId");
                parameters.Add("TipoId", filtros.TipoId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filtros.EstadoOperativo))
            {
                where.Add("v.estado_operativo = @EstadoOperativo");
                parameters.Add("EstadoOperativo", filtros.EstadoOperativo);
            }

            if (!string.IsNullOrWhiteSpace(filtros.Origen))
            {
                where.Add("v.origen = @Origen");
                parameters.Add("Origen", filtros.Origen);
            }

            if (!string.IsNullOrWhiteSpace(filtros.Estado))
            {
                where.Add("v.estado = @Estado");
                parameters.Add("Estado", filtros.Estado);
            }

            var whereSql = where.Count > 0 ? " WHERE " + string.Join(" AND ", where) : "";
            parameters.Add("Tamano", tamano);
            parameters.Add("Offset", (pagina - 1) * tamano);

            using var connection = AbrirConexion();

            var total = await connection.ExecuteScalarAsync<int>($@"
                SELECT COUNT(*)
                FROM vehiculos v
                LEFT JOIN cat_tipos_vehiculo t ON t.tipo_vehiculo_id = v.tipo_id
                {whereSql}", parameters);

            var items = (await connection.QueryAsync<VehiculoDto>($@"
                {VehiculoSelect}
                {whereSql}
                ORDER BY v.vehiculo_id DESC
                LIMIT @Tamano OFFSET @Offset", parameters)).ToList();

            return ServiceResult<VehiculoListResponseDto>.Success(new VehiculoListResponseDto
            {
                Items = items,
                TotalItems = total,
                PaginaActual = pagina,
                TamanoPagina = tamano,
                TotalPaginas = tamano > 0 ? (int)Math.Ceiling(total / (double)tamano) : 0
            });
        }
        catch (Exception ex)
        {
            return ServiceResult<VehiculoListResponseDto>.Internal($"Error al listar vehículos: {ex.Message}");
        }
    }

    public async Task<ServiceResult<VehiculoDto>> GetByIdAsync(int id)
    {
        try
        {
            using var connection = AbrirConexion();

            var vehiculo = await connection.QueryFirstOrDefaultAsync<VehiculoDto>(
                $"{VehiculoSelect} WHERE v.vehiculo_id = @Id", new { Id = id });

            if (vehiculo == null)
            {
                return ServiceResult<VehiculoDto>.NotFound("Vehículo no encontrado.");
            }

            vehiculo.Mantenimientos = (await connection.QueryAsync<VehiculoMantenimientoDto>(@"
                SELECT m.*, tl.nombre AS taller_nombre
                FROM vehiculo_mantenimientos m
                LEFT JOIN cat_talleres tl ON tl.taller_id = m.taller_id
                WHERE m.vehiculo_id = @Id
                ORDER BY m.fecha_ingreso DESC, m.mantenimiento_id DESC",
                new { Id = id })).ToList();

            vehiculo.Cupones = (await connection.QueryAsync<VehiculoCuponDto>(
                $"{CuponSelect} WHERE c.vehiculo_id = @Id ORDER BY c.fecha DESC, c.registro_id DESC",
                new { Id = id })).ToList();

            return ServiceResult<VehiculoDto>.Success(vehiculo);
        }
        catch (Exception ex)
        {
            return ServiceResult<VehiculoDto>.Internal($"Error al obtener vehículo: {ex.Message}");
        }
    }

    // ── Alta / edición ───────────────────────────────────────────────────────
    public async Task<ServiceResult<VehiculoDto>> CreateAsync(VehiculoCreateDto dto)
    {
        var validacion = Validar(dto);
        if (validacion != null)
        {
            return ServiceResult<VehiculoDto>.BadRequest(validacion);
        }

        using var connection = AbrirConexion();
        using var transaction = connection.BeginTransaction();

        try
        {
            var codigo = string.IsNullOrWhiteSpace(dto.Codigo) ? null : dto.Codigo.Trim();
            if (codigo != null)
            {
                var repetido = await connection.ExecuteScalarAsync<bool>(
                    "SELECT EXISTS(SELECT 1 FROM vehiculos WHERE codigo = @Codigo)",
                    new { Codigo = codigo }, transaction);
                if (repetido)
                {
                    return ServiceResult<VehiculoDto>.Conflict("El código interno ya está registrado.");
                }
            }

            var id = await connection.QuerySingleAsync<int>($@"
                INSERT INTO vehiculos
                    (codigo, tipo_id, marca, modelo, anio, color, placa, chasis, motor,
                     no_unidad, combustible, capacidad_tanque, kilometraje, condicion_llantas, volante_direccion,
                     seguro_hasta, estado_operativo, origen, estado, valor_unitario, ubicacion,
                     created_at, updated_at)
                VALUES
                    (@Codigo, @TipoId, @Marca, @Modelo, @Anio, @Color, @Placa, @Chasis, @Motor,
                     @NoUnidad, @Combustible, @CapacidadTanque, @Kilometraje, @CondicionLlantas, @VolanteDireccion,
                     @SeguroHasta, @EstadoOperativo, @Origen, @Estado, @ValorUnitario, @Ubicacion,
                     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING vehiculo_id;",
                Parametros(dto), transaction);

            await SincronizarDonacionEInventarioAsync(connection, transaction, id, dto);

            transaction.Commit();
            return await GetByIdAsync(id);
        }
        catch (Exception ex)
        {
            try { transaction.Rollback(); } catch { }
            return ServiceResult<VehiculoDto>.Internal($"Error al registrar vehículo: {ex.Message}");
        }
    }

    public async Task<ServiceResult<VehiculoDto>> UpdateAsync(int id, VehiculoUpdateDto dto)
    {
        var validacion = Validar(dto);
        if (validacion != null)
        {
            return ServiceResult<VehiculoDto>.BadRequest(validacion);
        }

        using var connection = AbrirConexion();
        using var transaction = connection.BeginTransaction();

        try
        {
            var existe = await connection.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM vehiculos WHERE vehiculo_id = @Id", new { Id = id }, transaction);
            if (existe == 0)
            {
                return ServiceResult<VehiculoDto>.NotFound("Vehículo no encontrado.");
            }

            var codigo = string.IsNullOrWhiteSpace(dto.Codigo) ? null : dto.Codigo.Trim();
            if (codigo != null)
            {
                var repetido = await connection.ExecuteScalarAsync<bool>(
                    "SELECT EXISTS(SELECT 1 FROM vehiculos WHERE codigo = @Codigo AND vehiculo_id <> @Id)",
                    new { Codigo = codigo, Id = id }, transaction);
                if (repetido)
                {
                    return ServiceResult<VehiculoDto>.Conflict("El código interno ya está registrado.");
                }
            }

            var parameters = Parametros(dto);
            parameters.Add("Id", id);

            await connection.ExecuteAsync(@"
                UPDATE vehiculos SET
                    codigo = @Codigo,
                    tipo_id = @TipoId,
                    marca = @Marca,
                    modelo = @Modelo,
                    anio = @Anio,
                    color = @Color,
                    placa = @Placa,
                    chasis = @Chasis,
                    motor = @Motor,
                    no_unidad = @NoUnidad,
                    combustible = @Combustible,
                    capacidad_tanque = @CapacidadTanque,
                    kilometraje = @Kilometraje,
                    condicion_llantas = @CondicionLlantas,
                    volante_direccion = @VolanteDireccion,
                    seguro_hasta = @SeguroHasta,
                    estado_operativo = @EstadoOperativo,
                    origen = @Origen,
                    estado = @Estado,
                    valor_unitario = @ValorUnitario,
                    ubicacion = @Ubicacion,
                    updated_at = CURRENT_TIMESTAMP
                WHERE vehiculo_id = @Id", parameters, transaction);

            await SincronizarDonacionEInventarioAsync(connection, transaction, id, dto);

            transaction.Commit();
            return await GetByIdAsync(id);
        }
        catch (Exception ex)
        {
            try { transaction.Rollback(); } catch { }
            return ServiceResult<VehiculoDto>.Internal($"Error al actualizar vehículo: {ex.Message}");
        }
    }

    public async Task<ServiceResult<VehiculoDto>> ChangeEstadoAsync(int id, string estado)
    {
        var nuevoEstado = EstadosRegistro.Contains(estado) ? Normalizar(estado) : null;
        if (nuevoEstado == null)
        {
            return ServiceResult<VehiculoDto>.BadRequest("Estado inválido. Use Activo o Inactivo.");
        }

        using var connection = AbrirConexion();
        using var transaction = connection.BeginTransaction();

        try
        {
            var afectados = await connection.ExecuteAsync(
                "UPDATE vehiculos SET estado = @Estado, updated_at = CURRENT_TIMESTAMP WHERE vehiculo_id = @Id",
                new { Estado = nuevoEstado, Id = id }, transaction);

            if (afectados == 0)
            {
                return ServiceResult<VehiculoDto>.NotFound("Vehículo no encontrado.");
            }

            var estadoInv = nuevoEstado == "Inactivo" ? "Baja" : "Activo";
            await connection.ExecuteAsync(@"
                UPDATE inventario_items SET
                    estado = @Estado,
                    fecha_baja = CASE WHEN @Estado = 'Baja' THEN CURRENT_DATE ELSE NULL END
                WHERE vehiculo_id = @Id",
                new { Estado = estadoInv, Id = id }, transaction);

            transaction.Commit();
            return await GetByIdAsync(id);
        }
        catch (Exception ex)
        {
            try { transaction.Rollback(); } catch { }
            return ServiceResult<VehiculoDto>.Internal($"Error al cambiar estado: {ex.Message}");
        }
    }

    public async Task<ServiceResult<VehiculoDto>> ChangeEstadoOperativoAsync(int id, string estadoOperativo)
    {
        var estado = estadoOperativo?.Trim() ?? "";
        var nuevoEstado = EstadosOperativos.Contains(estado) ? Normalizar(estado) : null;
        if (nuevoEstado == null)
        {
            return ServiceResult<VehiculoDto>.BadRequest("Estado operativo inválido.");
        }

        try
        {
            using var connection = AbrirConexion();

            var existe = await connection.ExecuteScalarAsync<bool>(
                "SELECT EXISTS(SELECT 1 FROM vehiculos WHERE vehiculo_id = @Id)",
                new { Id = id });
            if (!existe)
            {
                return ServiceResult<VehiculoDto>.NotFound("Vehículo no encontrado.");
            }

            var enProceso = await connection.ExecuteScalarAsync<bool>(@"
                SELECT EXISTS(
                    SELECT 1 FROM vehiculo_mantenimientos
                    WHERE vehiculo_id = @Id AND estado = 'En proceso')",
                new { Id = id });

            if (enProceso && !string.Equals(nuevoEstado, "Mantenimiento", StringComparison.OrdinalIgnoreCase))
            {
                return ServiceResult<VehiculoDto>.BadRequest(
                    "Hay un mantenimiento en proceso; finalízalo antes de cambiar el estado operativo.");
            }

            await connection.ExecuteAsync(
                "UPDATE vehiculos SET estado_operativo = @Estado, updated_at = CURRENT_TIMESTAMP WHERE vehiculo_id = @Id",
                new { Estado = nuevoEstado, Id = id });

            return await GetByIdAsync(id);
        }
        catch (Exception ex)
        {
            return ServiceResult<VehiculoDto>.Internal($"Error al cambiar estado operativo: {ex.Message}");
        }
    }

    public Task<ServiceResult> DeleteAsync(int id) => DeleteInternalAsync(id);

    private async Task<ServiceResult> DeleteInternalAsync(int id)
    {
        var result = await ChangeEstadoAsync(id, "Inactivo");
        return result.IsSuccess
            ? ServiceResult.Success()
            : ServiceResult.Failure(result.Error ?? "No se pudo desactivar el vehículo.", result.StatusCode);
    }

    // ── Mantenimientos ───────────────────────────────────────────────────────
    public async Task<ServiceResult<List<VehiculoMantenimientoDto>>> GetMantenimientosAsync(int vehiculoId)
    {
        try
        {
            using var connection = AbrirConexion();
            var items = (await connection.QueryAsync<VehiculoMantenimientoDto>(@"
                SELECT m.*, tl.nombre AS taller_nombre
                FROM vehiculo_mantenimientos m
                LEFT JOIN cat_talleres tl ON tl.taller_id = m.taller_id
                WHERE m.vehiculo_id = @Id
                ORDER BY m.fecha_ingreso DESC, m.mantenimiento_id DESC",
                new { Id = vehiculoId })).ToList();

            return ServiceResult<List<VehiculoMantenimientoDto>>.Success(items);
        }
        catch (Exception ex)
        {
            return ServiceResult<List<VehiculoMantenimientoDto>>.Internal($"Error al listar mantenimientos: {ex.Message}");
        }
    }

    public async Task<ServiceResult<VehiculoMantenimientoDto>> CreateMantenimientoAsync(
        int vehiculoId, VehiculoMantenimientoCreateDto dto)
    {
        var validacion = ValidarMantenimiento(dto);
        if (validacion != null)
        {
            return ServiceResult<VehiculoMantenimientoDto>.BadRequest(validacion);
        }

        using var connection = AbrirConexion();
        using var transaction = connection.BeginTransaction();

        try
        {
            var existe = await connection.ExecuteScalarAsync<bool>(
                "SELECT EXISTS(SELECT 1 FROM vehiculos WHERE vehiculo_id = @Id)",
                new { Id = vehiculoId }, transaction);
            if (!existe)
            {
                return ServiceResult<VehiculoMantenimientoDto>.NotFound("Vehículo no encontrado.");
            }

            var id = await connection.QuerySingleAsync<int>(@"
                INSERT INTO vehiculo_mantenimientos
                    (vehiculo_id, taller_id, tipo, fecha_ingreso, fecha_retorno, kilometraje,
                     descripcion, costo, estado,
                     combustible_entrada, combustible_salida,
                     pedales_clutch, pedales_frenos, pedales_acelerador,
                     aceite_motor, estado_bateria, nivel_refrigerante, sistema_direccion,
                     torreta_luces, sirena_bocina,
                     espejo_izquierdo, espejo_derecho, calavera_izquierda, calavera_derecha,
                     faro_izquierdo, faro_derecho, recomendaciones,
                     piloto_permanente, piloto_voluntario, escuadra, horario_turno,
                     jefe_servicio, firma_piloto, firma_jefe_servicio,
                     created_at, updated_at)
                VALUES
                    (@VehiculoId, @TallerId, @Tipo, @FechaIngreso, @FechaRetorno, @Kilometraje,
                     @Descripcion, @Costo, @Estado,
                     @CombustibleEntrada, @CombustibleSalida,
                     @PedalesClutch, @PedalesFrenos, @PedalesAcelerador,
                     @AceiteMotor, @EstadoBateria, @NivelRefrigerante, @SistemaDireccion,
                     @TorretaLuces, @SirenaBocina,
                     @EspejoIzquierdo, @EspejoDerecho, @CalaveraIzquierda, @CalaveraDerecha,
                     @FaroIzquierdo, @FaroDerecho, @Recomendaciones,
                     @PilotoPermanente, @PilotoVoluntario, @Escuadra, @HorarioTurno,
                     @JefeServicio, @FirmaPiloto, @FirmaJefeServicio,
                     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING mantenimiento_id;",
                new
                {
                    VehiculoId = vehiculoId,
                    dto.TallerId,
                    Tipo = Normalizar(dto.Tipo),
                    FechaIngreso = dto.FechaIngreso.Date,
                    FechaRetorno = dto.FechaRetorno?.Date,
                    dto.Kilometraje,
                    Descripcion = Limpiar(dto.Descripcion),
                    dto.Costo,
                    Estado = Normalizar(dto.Estado),
                    CombustibleEntrada = Limpiar(dto.CombustibleEntrada),
                    CombustibleSalida = Limpiar(dto.CombustibleSalida),
                    PedalesClutch = Limpiar(dto.PedalesClutch),
                    PedalesFrenos = Limpiar(dto.PedalesFrenos),
                    PedalesAcelerador = Limpiar(dto.PedalesAcelerador),
                    AceiteMotor = Limpiar(dto.AceiteMotor),
                    EstadoBateria = Limpiar(dto.EstadoBateria),
                    NivelRefrigerante = Limpiar(dto.NivelRefrigerante),
                    SistemaDireccion = Limpiar(dto.SistemaDireccion),
                    TorretaLuces = Limpiar(dto.TorretaLuces),
                    SirenaBocina = Limpiar(dto.SirenaBocina),
                    EspejoIzquierdo = Limpiar(dto.EspejoIzquierdo),
                    EspejoDerecho = Limpiar(dto.EspejoDerecho),
                    CalaveraIzquierda = Limpiar(dto.CalaveraIzquierda),
                    CalaveraDerecha = Limpiar(dto.CalaveraDerecha),
                    FaroIzquierdo = Limpiar(dto.FaroIzquierdo),
                    FaroDerecho = Limpiar(dto.FaroDerecho),
                    Recomendaciones = Limpiar(dto.Recomendaciones),
                    PilotoPermanente = Limpiar(dto.PilotoPermanente),
                    PilotoVoluntario = Limpiar(dto.PilotoVoluntario),
                    Escuadra = Limpiar(dto.Escuadra),
                    HorarioTurno = Limpiar(dto.HorarioTurno),
                    JefeServicio = Limpiar(dto.JefeServicio),
                    FirmaPiloto = Limpiar(dto.FirmaPiloto),
                    FirmaJefeServicio = Limpiar(dto.FirmaJefeServicio)
                }, transaction);

            await RecalcularEstadoOperativoAsync(connection, transaction, vehiculoId);
            transaction.Commit();

            var creado = await connection.QueryFirstOrDefaultAsync<VehiculoMantenimientoDto>(@"
                SELECT m.*, tl.nombre AS taller_nombre
                FROM vehiculo_mantenimientos m
                LEFT JOIN cat_talleres tl ON tl.taller_id = m.taller_id
                WHERE m.mantenimiento_id = @Id", new { Id = id });

            return ServiceResult<VehiculoMantenimientoDto>.Success(creado!);
        }
        catch (Exception ex)
        {
            try { transaction.Rollback(); } catch { }
            return ServiceResult<VehiculoMantenimientoDto>.Internal($"Error al registrar mantenimiento: {ex.Message}");
        }
    }

    public async Task<ServiceResult<VehiculoMantenimientoDto>> UpdateMantenimientoAsync(
        int id, VehiculoMantenimientoCreateDto dto)
    {
        var validacion = ValidarMantenimiento(dto);
        if (validacion != null)
        {
            return ServiceResult<VehiculoMantenimientoDto>.BadRequest(validacion);
        }

        using var connection = AbrirConexion();
        using var transaction = connection.BeginTransaction();

        try
        {
            var vehiculoId = await connection.QueryFirstOrDefaultAsync<int?>(
                "SELECT vehiculo_id FROM vehiculo_mantenimientos WHERE mantenimiento_id = @Id",
                new { Id = id }, transaction);
            if (!vehiculoId.HasValue)
            {
                return ServiceResult<VehiculoMantenimientoDto>.NotFound("Mantenimiento no encontrado.");
            }

            await connection.ExecuteAsync(@"
                UPDATE vehiculo_mantenimientos SET
                    taller_id = @TallerId,
                    tipo = @Tipo,
                    fecha_ingreso = @FechaIngreso,
                    fecha_retorno = @FechaRetorno,
                    kilometraje = @Kilometraje,
                    descripcion = @Descripcion,
                    costo = @Costo,
                    estado = @Estado,
                    combustible_entrada = @CombustibleEntrada,
                    combustible_salida = @CombustibleSalida,
                    pedales_clutch = @PedalesClutch,
                    pedales_frenos = @PedalesFrenos,
                    pedales_acelerador = @PedalesAcelerador,
                    aceite_motor = @AceiteMotor,
                    estado_bateria = @EstadoBateria,
                    nivel_refrigerante = @NivelRefrigerante,
                    sistema_direccion = @SistemaDireccion,
                    torreta_luces = @TorretaLuces,
                    sirena_bocina = @SirenaBocina,
                    espejo_izquierdo = @EspejoIzquierdo,
                    espejo_derecho = @EspejoDerecho,
                    calavera_izquierda = @CalaveraIzquierda,
                    calavera_derecha = @CalaveraDerecha,
                    faro_izquierdo = @FaroIzquierdo,
                    faro_derecho = @FaroDerecho,
                    recomendaciones = @Recomendaciones,
                    piloto_permanente = @PilotoPermanente,
                    piloto_voluntario = @PilotoVoluntario,
                    escuadra = @Escuadra,
                    horario_turno = @HorarioTurno,
                    jefe_servicio = @JefeServicio,
                    firma_piloto = @FirmaPiloto,
                    firma_jefe_servicio = @FirmaJefeServicio,
                    updated_at = CURRENT_TIMESTAMP
                WHERE mantenimiento_id = @Id",
                new
                {
                    Id = id,
                    dto.TallerId,
                    Tipo = Normalizar(dto.Tipo),
                    FechaIngreso = dto.FechaIngreso.Date,
                    FechaRetorno = dto.FechaRetorno?.Date,
                    dto.Kilometraje,
                    Descripcion = Limpiar(dto.Descripcion),
                    dto.Costo,
                    Estado = Normalizar(dto.Estado),
                    CombustibleEntrada = Limpiar(dto.CombustibleEntrada),
                    CombustibleSalida = Limpiar(dto.CombustibleSalida),
                    PedalesClutch = Limpiar(dto.PedalesClutch),
                    PedalesFrenos = Limpiar(dto.PedalesFrenos),
                    PedalesAcelerador = Limpiar(dto.PedalesAcelerador),
                    AceiteMotor = Limpiar(dto.AceiteMotor),
                    EstadoBateria = Limpiar(dto.EstadoBateria),
                    NivelRefrigerante = Limpiar(dto.NivelRefrigerante),
                    SistemaDireccion = Limpiar(dto.SistemaDireccion),
                    TorretaLuces = Limpiar(dto.TorretaLuces),
                    SirenaBocina = Limpiar(dto.SirenaBocina),
                    EspejoIzquierdo = Limpiar(dto.EspejoIzquierdo),
                    EspejoDerecho = Limpiar(dto.EspejoDerecho),
                    CalaveraIzquierda = Limpiar(dto.CalaveraIzquierda),
                    CalaveraDerecha = Limpiar(dto.CalaveraDerecha),
                    FaroIzquierdo = Limpiar(dto.FaroIzquierdo),
                    FaroDerecho = Limpiar(dto.FaroDerecho),
                    Recomendaciones = Limpiar(dto.Recomendaciones),
                    PilotoPermanente = Limpiar(dto.PilotoPermanente),
                    PilotoVoluntario = Limpiar(dto.PilotoVoluntario),
                    Escuadra = Limpiar(dto.Escuadra),
                    HorarioTurno = Limpiar(dto.HorarioTurno),
                    JefeServicio = Limpiar(dto.JefeServicio),
                    FirmaPiloto = Limpiar(dto.FirmaPiloto),
                    FirmaJefeServicio = Limpiar(dto.FirmaJefeServicio)
                }, transaction);

            await RecalcularEstadoOperativoAsync(connection, transaction, vehiculoId.Value);
            transaction.Commit();

            var actualizado = await connection.QueryFirstOrDefaultAsync<VehiculoMantenimientoDto>(@"
                SELECT m.*, tl.nombre AS taller_nombre
                FROM vehiculo_mantenimientos m
                LEFT JOIN cat_talleres tl ON tl.taller_id = m.taller_id
                WHERE m.mantenimiento_id = @Id", new { Id = id });

            return ServiceResult<VehiculoMantenimientoDto>.Success(actualizado!);
        }
        catch (Exception ex)
        {
            try { transaction.Rollback(); } catch { }
            return ServiceResult<VehiculoMantenimientoDto>.Internal($"Error al actualizar mantenimiento: {ex.Message}");
        }
    }

    public async Task<ServiceResult> DeleteMantenimientoAsync(int id)
    {
        using var connection = AbrirConexion();
        using var transaction = connection.BeginTransaction();

        try
        {
            var vehiculoId = await connection.QueryFirstOrDefaultAsync<int?>(
                "SELECT vehiculo_id FROM vehiculo_mantenimientos WHERE mantenimiento_id = @Id",
                new { Id = id }, transaction);
            if (!vehiculoId.HasValue)
            {
                return ServiceResult.NotFound("Mantenimiento no encontrado.");
            }

            await connection.ExecuteAsync(
                "DELETE FROM vehiculo_mantenimientos WHERE mantenimiento_id = @Id",
                new { Id = id }, transaction);

            await RecalcularEstadoOperativoAsync(connection, transaction, vehiculoId.Value);
            transaction.Commit();

            return ServiceResult.Success();
        }
        catch (Exception ex)
        {
            try { transaction.Rollback(); } catch { }
            return ServiceResult.Internal($"Error al eliminar mantenimiento: {ex.Message}");
        }
    }

    // ── Sincronización con Donaciones e Inventario ───────────────────────────
    private static async Task SincronizarDonacionEInventarioAsync(
        DbConnection connection, DbTransaction transaction, int vehiculoId, VehiculoCreateDto dto)
    {
        var vinculos = await connection.QueryFirstOrDefaultAsync<VinculosRow>(@"
            SELECT v.donacion_id, i.item_id
            FROM vehiculos v
            LEFT JOIN inventario_items i ON i.vehiculo_id = v.vehiculo_id
            WHERE v.vehiculo_id = @Id", new { Id = vehiculoId }, transaction);

        var tipoNombre = await connection.QueryFirstOrDefaultAsync<string?>(
            "SELECT nombre FROM cat_tipos_vehiculo WHERE tipo_vehiculo_id = @Id",
            new { Id = dto.TipoId }, transaction);

        var categoriaInvId = await connection.QueryFirstOrDefaultAsync<int?>(
            "SELECT categoria_inv_id FROM cat_categorias_inventario WHERE nombre = 'Vehículos' LIMIT 1",
            transaction: transaction);

        if (!categoriaInvId.HasValue)
        {
            categoriaInvId = await connection.QuerySingleAsync<int>(@"
                INSERT INTO cat_categorias_inventario (nombre, descripcion)
                VALUES ('Vehículos', 'Vehículos de la subestación')
                ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
                RETURNING categoria_inv_id;", transaction: transaction);
        }

        var esDonado = string.Equals(dto.Origen, "Donado", StringComparison.OrdinalIgnoreCase);
        var nombre = ConstruirNombre(tipoNombre, dto);
        var estadoInv = string.Equals(dto.Estado, "Inactivo", StringComparison.OrdinalIgnoreCase) ? "Baja" : "Activo";

        int? donacionId = vinculos?.DonacionId;
        string? nombreDonante = null;
        string? noRecibo = null;

        if (esDonado)
        {
            nombreDonante = string.IsNullOrWhiteSpace(dto.Donante) ? "Donante no especificado" : dto.Donante.Trim();
            var fechaDonacion = (dto.FechaDonacion ?? DateTime.Today).Date;

            if (donacionId.HasValue)
            {
                noRecibo = string.IsNullOrWhiteSpace(dto.NoReciboDonacion)
                    ? await connection.QueryFirstOrDefaultAsync<string?>(
                        "SELECT no_recibo FROM donaciones WHERE donacion_id = @Id",
                        new { Id = donacionId.Value }, transaction)
                    : dto.NoReciboDonacion.Trim();

                await connection.ExecuteAsync(@"
                    UPDATE donaciones SET
                        fecha = @Fecha,
                        no_recibo = @NoRecibo,
                        donante = @Donante,
                        dpi_nit = @DpiNit,
                        telefono = @Telefono,
                        tipo = 'Material',
                        categoria = 'Vehículos',
                        descripcion = @Descripcion,
                        monto = @Monto,
                        estado = 'Confirmado',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE donacion_id = @Id",
                    new
                    {
                        Fecha = fechaDonacion,
                        NoRecibo = noRecibo ?? $"VEH-{donacionId.Value}",
                        Donante = nombreDonante,
                        dto.DpiNit,
                        dto.Telefono,
                        Descripcion = nombre,
                        Monto = dto.ValorUnitario,
                        Id = donacionId.Value
                    }, transaction);

                noRecibo ??= $"VEH-{donacionId.Value}";
            }
            else
            {
                noRecibo = string.IsNullOrWhiteSpace(dto.NoReciboDonacion)
                    ? $"VEH-{DateTime.Now:yyyyMMddHHmmss}-{vehiculoId}"
                    : dto.NoReciboDonacion.Trim();

                var existeRecibo = await connection.ExecuteScalarAsync<bool>(
                    "SELECT EXISTS(SELECT 1 FROM donaciones WHERE no_recibo = @NoRecibo)",
                    new { NoRecibo = noRecibo }, transaction);
                if (existeRecibo)
                {
                    noRecibo = $"{noRecibo}-{vehiculoId}";
                }

                donacionId = await connection.QuerySingleAsync<int>(@"
                    INSERT INTO donaciones
                        (fecha, no_recibo, donante, dpi_nit, telefono, tipo, categoria,
                         descripcion, monto, estado, created_at, updated_at)
                    VALUES
                        (@Fecha, @NoRecibo, @Donante, @DpiNit, @Telefono, 'Material', 'Vehículos',
                         @Descripcion, @Monto, 'Confirmado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING donacion_id;",
                    new
                    {
                        Fecha = fechaDonacion,
                        NoRecibo = noRecibo,
                        Donante = nombreDonante,
                        dto.DpiNit,
                        dto.Telefono,
                        Descripcion = nombre,
                        Monto = dto.ValorUnitario
                    }, transaction);
            }

            await connection.ExecuteAsync(
                "UPDATE vehiculos SET donacion_id = @DonacionId WHERE vehiculo_id = @Id",
                new { DonacionId = donacionId.Value, Id = vehiculoId }, transaction);

            await DonacionLibroHelper.UpsertMovimientoVehiculoAsync(
                connection, transaction, vehiculoId, fechaDonacion,
                $"Donación de vehículo: {nombre}", dto.ValorUnitario, donacionId, noRecibo);
        }
        else if (donacionId.HasValue)
        {
            await DonacionLibroHelper.DeleteMovimientoVehiculoAsync(connection, transaction, vehiculoId);

            await connection.ExecuteAsync(
                "UPDATE inventario_items SET donacion_id = NULL WHERE donacion_id = @Id",
                new { Id = donacionId.Value }, transaction);
            await connection.ExecuteAsync(
                "DELETE FROM donaciones WHERE donacion_id = @Id",
                new { Id = donacionId.Value }, transaction);
            await connection.ExecuteAsync(
                "UPDATE vehiculos SET donacion_id = NULL WHERE vehiculo_id = @Id",
                new { Id = vehiculoId }, transaction);

            donacionId = null;
        }

        var itemId = vinculos?.ItemId;

        if (!itemId.HasValue && !string.IsNullOrWhiteSpace(dto.Codigo))
        {
            itemId = await connection.QueryFirstOrDefaultAsync<int?>(
                "SELECT item_id FROM inventario_items WHERE codigo_barras = @Codigo AND vehiculo_id IS NULL LIMIT 1",
                new { Codigo = dto.Codigo.Trim() }, transaction);
        }

        if (itemId.HasValue)
        {
            await connection.ExecuteAsync(@"
                UPDATE inventario_items SET
                    categoria_inv_id = @CategoriaInvId,
                    codigo_barras = @CodigoBarras,
                    nombre = @Nombre,
                    stock_actual = 1,
                    unidad_medida = 'Unidad',
                    valor_unitario = @ValorUnitario,
                    estado = @Estado,
                    fecha_baja = CASE WHEN @Estado = 'Baja' THEN CURRENT_DATE ELSE NULL END,
                    ubicacion = @Ubicacion,
                    origen = @Origen,
                    donacion_id = @DonacionId,
                    nombre_donante = @NombreDonante,
                    no_recibo = @NoRecibo,
                    vehiculo_id = @VehiculoId
                WHERE item_id = @ItemId",
                new
                {
                    ItemId = itemId.Value,
                    CategoriaInvId = categoriaInvId.Value,
                    CodigoBarras = string.IsNullOrWhiteSpace(dto.Codigo) ? null : dto.Codigo.Trim(),
                    Nombre = nombre,
                    ValorUnitario = dto.ValorUnitario,
                    Estado = estadoInv,
                    Ubicacion = string.IsNullOrWhiteSpace(dto.Ubicacion) ? null : dto.Ubicacion.Trim(),
                    Origen = esDonado ? "Donado" : "Compra Propia",
                    DonacionId = donacionId,
                    NombreDonante = nombreDonante,
                    NoRecibo = noRecibo,
                    VehiculoId = vehiculoId
                }, transaction);
        }
        else
        {
            itemId = await connection.QuerySingleAsync<int>(@"
                INSERT INTO inventario_items
                    (categoria_inv_id, codigo_barras, nombre, stock_actual, stock_minimo,
                     unidad_medida, valor_unitario, estado, ubicacion, es_central,
                     donacion_id, origen, nombre_donante, no_recibo, vehiculo_id, created_at)
                VALUES
                    (@CategoriaInvId, @CodigoBarras, @Nombre, 1, 0,
                     'Unidad', @ValorUnitario, @Estado, @Ubicacion, FALSE,
                     @DonacionId, @Origen, @NombreDonante, @NoRecibo, @VehiculoId, CURRENT_TIMESTAMP)
                RETURNING item_id;",
                new
                {
                    CategoriaInvId = categoriaInvId.Value,
                    CodigoBarras = string.IsNullOrWhiteSpace(dto.Codigo) ? null : dto.Codigo.Trim(),
                    Nombre = nombre,
                    ValorUnitario = dto.ValorUnitario,
                    Estado = estadoInv,
                    Ubicacion = string.IsNullOrWhiteSpace(dto.Ubicacion) ? null : dto.Ubicacion.Trim(),
                    Origen = esDonado ? "Donado" : "Compra Propia",
                    DonacionId = donacionId,
                    NombreDonante = nombreDonante,
                    NoRecibo = noRecibo,
                    VehiculoId = vehiculoId
                }, transaction);

            var tipoEntrada = await connection.QueryFirstOrDefaultAsync<int?>(
                "SELECT tipo_mov_id FROM cat_tipos_movimiento WHERE codigo = 'ENTRADA' LIMIT 1",
                transaction: transaction);
            if (tipoEntrada.HasValue)
            {
                await connection.ExecuteAsync(@"
                    INSERT INTO inventario_movimientos (item_id, tipo_mov_id, cantidad, motivo, fecha_hora)
                    VALUES (@ItemId, @TipoMovId, 1, 'Alta de vehículo', CURRENT_TIMESTAMP);",
                    new { ItemId = itemId.Value, TipoMovId = tipoEntrada.Value }, transaction);
            }
        }
    }

    private static async Task RecalcularEstadoOperativoAsync(
        DbConnection connection, DbTransaction transaction, int vehiculoId)
    {
        var enProceso = await connection.ExecuteScalarAsync<bool>(@"
            SELECT EXISTS(
                SELECT 1 FROM vehiculo_mantenimientos
                WHERE vehiculo_id = @Id AND estado = 'En proceso')",
            new { Id = vehiculoId }, transaction);

        if (enProceso)
        {
            await connection.ExecuteAsync(@"
                UPDATE vehiculos SET estado_operativo = 'Mantenimiento', updated_at = CURRENT_TIMESTAMP
                WHERE vehiculo_id = @Id", new { Id = vehiculoId }, transaction);
        }
        else
        {
            await connection.ExecuteAsync(@"
                UPDATE vehiculos SET estado_operativo = 'Operativa', updated_at = CURRENT_TIMESTAMP
                WHERE vehiculo_id = @Id AND estado_operativo = 'Mantenimiento'",
                new { Id = vehiculoId }, transaction);
        }
    }

    // ── Utilidades ───────────────────────────────────────────────────────────
    private static DynamicParameters Parametros(VehiculoCreateDto dto)
    {
        var parameters = new DynamicParameters();
        parameters.Add("Codigo", string.IsNullOrWhiteSpace(dto.Codigo) ? null : dto.Codigo.Trim());
        parameters.Add("TipoId", dto.TipoId);
        parameters.Add("Marca", dto.Marca.Trim());
        parameters.Add("Modelo", dto.Modelo.Trim());
        parameters.Add("Anio", dto.Anio);
        parameters.Add("Color", string.IsNullOrWhiteSpace(dto.Color) ? null : dto.Color.Trim());
        parameters.Add("Placa", string.IsNullOrWhiteSpace(dto.Placa) ? null : dto.Placa.Trim());
        parameters.Add("Chasis", string.IsNullOrWhiteSpace(dto.Chasis) ? null : dto.Chasis.Trim());
        parameters.Add("Motor", string.IsNullOrWhiteSpace(dto.Motor) ? null : dto.Motor.Trim());
        parameters.Add("NoUnidad", string.IsNullOrWhiteSpace(dto.NoUnidad) ? null : dto.NoUnidad.Trim());
        parameters.Add("Combustible", string.IsNullOrWhiteSpace(dto.Combustible) ? null : dto.Combustible.Trim());
        parameters.Add("CapacidadTanque", dto.CapacidadTanque);
        parameters.Add("Kilometraje", dto.Kilometraje < 0 ? 0 : dto.Kilometraje);
        parameters.Add("CondicionLlantas", string.IsNullOrWhiteSpace(dto.CondicionLlantas) ? null : dto.CondicionLlantas.Trim());
        parameters.Add("VolanteDireccion", string.IsNullOrWhiteSpace(dto.VolanteDireccion) ? null : dto.VolanteDireccion.Trim());
        parameters.Add("SeguroHasta", dto.SeguroHasta?.Date);
        parameters.Add("EstadoOperativo", string.IsNullOrWhiteSpace(dto.EstadoOperativo) ? "Operativa" : Normalizar(dto.EstadoOperativo));
        parameters.Add("Origen", string.IsNullOrWhiteSpace(dto.Origen) ? "Compra Propia" : Normalizar(dto.Origen));
        parameters.Add("Estado", string.IsNullOrWhiteSpace(dto.Estado) ? "Activo" : Normalizar(dto.Estado));
        parameters.Add("ValorUnitario", dto.ValorUnitario < 0 ? 0 : dto.ValorUnitario);
        parameters.Add("Ubicacion", string.IsNullOrWhiteSpace(dto.Ubicacion) ? null : dto.Ubicacion.Trim());
        return parameters;
    }

    private static string? Validar(VehiculoCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Marca)) return "La marca es obligatoria.";
        if (string.IsNullOrWhiteSpace(dto.Modelo)) return "El modelo es obligatorio.";
        if (dto.ValorUnitario < 0) return "El valor del vehículo no puede ser negativo.";
        if (dto.Kilometraje < 0) return "El kilometraje no puede ser negativo.";
        if (!string.IsNullOrWhiteSpace(dto.EstadoOperativo) && !EstadosOperativos.Contains(dto.EstadoOperativo))
            return "El estado operativo no es válido.";
        if (!string.IsNullOrWhiteSpace(dto.Origen) && !Origenes.Contains(dto.Origen))
            return "El origen debe ser 'Compra Propia' o 'Donado'.";
        if (!string.IsNullOrWhiteSpace(dto.Estado) && !EstadosRegistro.Contains(dto.Estado))
            return "El estado debe ser 'Activo' o 'Inactivo'.";
        return null;
    }

    private static string? ValidarMantenimiento(VehiculoMantenimientoCreateDto dto)
    {
        if (dto.FechaIngreso == default) return "La fecha de ingreso es obligatoria.";
        if (string.IsNullOrWhiteSpace(dto.Tipo)) return "El tipo de mantenimiento es obligatorio.";
        if (!EstadosMantenimiento.Contains(dto.Estado)) return "El estado del mantenimiento no es válido.";
        if (dto.Costo < 0) return "El costo no puede ser negativo.";
        return null;
    }

    private static string ConstruirNombre(string? tipo, VehiculoCreateDto dto)
    {
        var tipoNormalizado = tipo?.Trim();
        var tipoYaEsVehiculo = !string.IsNullOrWhiteSpace(tipoNormalizado)
            && tipoNormalizado.StartsWith("Vehículo", StringComparison.OrdinalIgnoreCase);

        var partes = new List<string>();
        if (!tipoYaEsVehiculo) partes.Add("Vehículo");
        if (!string.IsNullOrWhiteSpace(tipoNormalizado)) partes.Add(tipoNormalizado);
        partes.Add(dto.Marca.Trim());
        partes.Add(dto.Modelo.Trim());
        if (dto.Anio.HasValue) partes.Add(dto.Anio.Value.ToString());
        if (!string.IsNullOrWhiteSpace(dto.Chasis)) partes.Add($"chasis {dto.Chasis.Trim()}");

        var nombre = string.Join(' ', partes);
        return nombre.Length > 200 ? nombre[..200] : nombre;
    }

    private static string? Limpiar(string? valor)
        => string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

    private static string Normalizar(string valor)
    {
        var limpio = valor.Trim().ToLowerInvariant();
        return limpio switch
        {
            "compra propia" => "Compra Propia",
            "donado" => "Donado",
            "activo" => "Activo",
            "inactivo" => "Inactivo",
            "operativa" => "Operativa",
            "en servicio" => "En Servicio",
            "mantenimiento" => "Mantenimiento",
            "fuera de servicio" => "Fuera de Servicio",
            "preventivo" => "Preventivo",
            "correctivo" => "Correctivo",
            "en proceso" => "En proceso",
            "finalizado" => "Finalizado",
            _ => valor.Trim()
        };
    }
}
