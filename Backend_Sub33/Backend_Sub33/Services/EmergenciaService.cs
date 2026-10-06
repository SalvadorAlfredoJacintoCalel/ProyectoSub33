using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Dapper;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs;

namespace Backend_Sub33.Services
{
    public interface IEmergenciaService
    {
        Task<EmergenciaListResponseDto> ListarEmergenciasAsync(EmergenciaFiltrosDto filtros);
        Task<EmergenciaResponseDto?> ObtenerEmergenciaPorIdAsync(int id);
        Task<EmergenciaResponseDto> CrearEmergenciaAsync(EmergenciaCreateDto dto);
        Task<EmergenciaResponseDto?> ActualizarEmergenciaAsync(int id, EmergenciaUpdateDto dto);
        Task<bool> CambiarEstadoAsync(int id, string estado);
        Task<string> ObtenerSiguienteIncidenteAsync();
    }

    public class EmergenciaService : IEmergenciaService
    {
        private readonly AppDbContext _context;

        public EmergenciaService(AppDbContext context)
        {
            _context = context;
        }

        private System.Data.Common.DbConnection AbrirConexion()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open)
            {
                connection.Open();
            }
            return connection;
        }

        public async Task<EmergenciaListResponseDto> ListarEmergenciasAsync(EmergenciaFiltrosDto filtros)
        {
            using var connection = AbrirConexion();

            var whereConditions = new List<string> { "1=1" };
            var parameters = new DynamicParameters();

            if (!string.IsNullOrWhiteSpace(filtros.Busqueda))
            {
                whereConditions.Add(@"(es.numero_incidente ILIKE @Busqueda OR es.paciente ILIKE @Busqueda OR es.solicitante ILIKE @Busqueda OR es.domicilio ILIKE @Busqueda OR es.ubicacion ILIKE @Busqueda)");
                parameters.Add("Busqueda", $"%{filtros.Busqueda}%");
            }

            if (!string.IsNullOrWhiteSpace(filtros.Unidad))
            {
                whereConditions.Add("es.unidad_asignada_nombre ILIKE @Unidad");
                parameters.Add("Unidad", $"%{filtros.Unidad}%");
            }

            if (!string.IsNullOrWhiteSpace(filtros.Tipo))
            {
                whereConditions.Add("EXISTS (SELECT 1 FROM servicio_tipos_asistencia sta WHERE sta.servicio_id = es.servicio_id AND sta.tipo_asistencia = @Tipo)");
                parameters.Add("Tipo", filtros.Tipo);
            }

            if (!string.IsNullOrWhiteSpace(filtros.Piloto))
            {
                whereConditions.Add("EXISTS (SELECT 1 FROM servicio_personal_asignado spa WHERE spa.servicio_id = es.servicio_id AND spa.nombre_personal ILIKE @Piloto)");
                parameters.Add("Piloto", $"%{filtros.Piloto}%");
            }

            if (filtros.Desde.HasValue)
            {
                whereConditions.Add("es.fecha >= @Desde");
                parameters.Add("Desde", filtros.Desde.Value);
            }

            if (filtros.Hasta.HasValue)
            {
                whereConditions.Add("es.fecha <= @Hasta");
                parameters.Add("Hasta", filtros.Hasta.Value);
            }

            if (!string.IsNullOrWhiteSpace(filtros.Estado))
            {
                whereConditions.Add("es.estado = @Estado");
                parameters.Add("Estado", filtros.Estado);
            }

            var whereClause = string.Join(" AND ", whereConditions);

            var sqlTotal = $"SELECT COUNT(*) FROM emergencias_servicios es WHERE {whereClause}";
            var totalItems = await connection.ExecuteScalarAsync<int>(sqlTotal, parameters);

            var offset = (filtros.Pagina - 1) * filtros.TamanoPagina;
            var sql = $@"
                SELECT 
                    es.servicio_id,
                    es.numero_incidente,
                    es.fecha,
                    to_char(es.hora_salida, 'HH24:MI') AS hora_salida,
                    to_char(es.hora_entrada, 'HH24:MI') AS hora_entrada,
                    es.solicitud_tipo,
                    es.paciente,
                    es.edad,
                    es.genero,
                    es.ubicacion,
                    es.hospital_destino_nombre,
                    es.unidad_asignada_nombre,
                    es.estado,
                    COALESCE(
                        (SELECT string_agg(sta.tipo_asistencia, ', ') 
                         FROM servicio_tipos_asistencia sta 
                         WHERE sta.servicio_id = es.servicio_id),
                        ''
                    ) AS tipos_asistencia_raw
                FROM emergencias_servicios es
                WHERE {whereClause}
                ORDER BY es.fecha DESC, es.servicio_id DESC
                LIMIT @TamanoPagina OFFSET @Offset";

            parameters.Add("TamanoPagina", filtros.TamanoPagina);
            parameters.Add("Offset", offset);

            var items = await connection.QueryAsync<EmergenciaListItemDto>(sql, parameters);

            var listaItems = items.ToList();
            foreach (var item in listaItems)
            {
                if (!string.IsNullOrEmpty(item.TiposAsistenciaRaw))
                {
                    item.TiposAsistencia = item.TiposAsistenciaRaw.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries).Select(t => t.Trim()).ToList();
                }
            }

            var totalPaginas = (int)Math.Ceiling((double)totalItems / filtros.TamanoPagina);

            return new EmergenciaListResponseDto
            {
                Items = listaItems,
                TotalItems = totalItems,
                PaginaActual = filtros.Pagina,
                TamanoPagina = filtros.TamanoPagina,
                TotalPaginas = totalPaginas,
                TienePaginaAnterior = filtros.Pagina > 1,
                TienePaginaSiguiente = filtros.Pagina < totalPaginas
            };
        }

        public async Task<EmergenciaResponseDto?> ObtenerEmergenciaPorIdAsync(int id)
        {
            using var connection = AbrirConexion();

            var sql = @"
                SELECT 
                    servicio_id,
                    numero_incidente,
                    fecha,
                    to_char(hora_salida, 'HH24:MI') AS hora_salida,
                    to_char(hora_entrada, 'HH24:MI') AS hora_entrada,
                    solicitud_tipo,
                    paciente,
                    edad,
                    genero,
                    solicitante,
                    acompanante,
                    domicilio,
                    fallecio,
                    ubicacion,
                    tipo_emergencia_id,
                    hospital_destino_id,
                    hospital_destino_nombre,
                    estado_entrega,
                    unidad_asignada_id,
                    unidad_asignada_nombre,
                    formulado_por_id,
                    creado_por_nombre,
                    resumen,
                    estado,
                    created_at AS fecha_creacion,
                    updated_at AS fecha_modificacion
                FROM emergencias_servicios
                WHERE servicio_id = @Id";

            var emergencia = await connection.QueryFirstOrDefaultAsync<EmergenciaResponseDto>(sql, new { Id = id });

            if (emergencia == null) return null;

            var sqlTipos = "SELECT tipo_asistencia FROM servicio_tipos_asistencia WHERE servicio_id = @Id";
            var tipos = await connection.QueryAsync<string>(sqlTipos, new { Id = id });
            emergencia.TiposAsistencia = tipos.ToList();

            var sqlPersonal = "SELECT spa.personal_id, spa.nombre_personal, spa.rol_servicio_id, COALESCE(crs.nombre, '') AS rol_en_servicio FROM servicio_personal_asignado spa LEFT JOIN cat_roles_servicio crs ON crs.rol_servicio_id = spa.rol_servicio_id WHERE spa.servicio_id = @Id";
            var personal = await connection.QueryAsync<PersonalAsignadoDto>(sqlPersonal, new { Id = id });
            emergencia.PersonalAsignado = personal.ToList();

            var sqlSignos = "SELECT presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, saturacion_oxigeno, to_char(hora_toma, 'HH24:MI') AS hora_toma FROM signos_vitales_paciente WHERE servicio_id = @Id";
            var signos = await connection.QueryFirstOrDefaultAsync<SignosVitalesDto>(sqlSignos, new { Id = id });
            emergencia.SignosVitales = signos;

            return emergencia;
        }

        public async Task<EmergenciaResponseDto> CrearEmergenciaAsync(EmergenciaCreateDto dto)
        {
            using var connection = AbrirConexion();

            using var transaction = connection.BeginTransaction();

            int servicioId;

            try
            {
                var numeroIncidente = dto.NumeroIncidente?.Trim();
                if (string.IsNullOrEmpty(numeroIncidente))
                {
                    var anioActual = DateTime.Now.Year;
                    var ultimoCodigo = await connection.QueryFirstOrDefaultAsync<string?>(
                        "SELECT numero_incidente FROM emergencias_servicios WHERE numero_incidente LIKE @Pattern ORDER BY servicio_id DESC LIMIT 1;",
                        new { Pattern = $"INC-{anioActual}-%" }, transaction);
                    int siguienteNumero = 1;
                    if (!string.IsNullOrEmpty(ultimoCodigo))
                    {
                        var partes = ultimoCodigo.Split('-');
                        if (partes.Length == 3 && int.TryParse(partes[2], out int actual))
                        {
                            siguienteNumero = actual + 1;
                        }
                    }
                    numeroIncidente = $"INC-{anioActual}-{siguienteNumero:D3}";
                }

                var hospitalNombre = dto.HospitalDestinoNombre;
                if (string.IsNullOrWhiteSpace(hospitalNombre) && dto.HospitalDestinoId.HasValue)
                {
                    hospitalNombre = await connection.QueryFirstOrDefaultAsync<string?>(
                        "SELECT nombre FROM cat_hospitales WHERE hospital_id = @Id",
                        new { Id = dto.HospitalDestinoId.Value }, transaction);
                }

                var unidadNombre = dto.UnidadAsignadaNombre;
                if (string.IsNullOrWhiteSpace(unidadNombre) && dto.UnidadAsignadaId.HasValue)
                {
                    unidadNombre = await connection.QueryFirstOrDefaultAsync<string?>(
                        "SELECT codigo_unidad FROM cat_unidades WHERE unidad_id = @Id",
                        new { Id = dto.UnidadAsignadaId.Value }, transaction);
                }

                TimeSpan? horaSalida = TimeSpan.TryParse(dto.HoraSalida, out var hs) ? hs : null;
                TimeSpan? horaEntrada = TimeSpan.TryParse(dto.HoraEntrada, out var he) ? he : null;

                var sqlEmergencia = @"
                    INSERT INTO emergencias_servicios (
                        numero_incidente, fecha, hora_salida, hora_entrada, solicitud_tipo,
                        paciente, edad, genero, solicitante, acompanante, domicilio, fallecio,
                        ubicacion, tipo_emergencia_id, hospital_destino_id, hospital_destino_nombre,
                        estado_entrega, unidad_asignada_id, unidad_asignada_nombre, formulado_por_id,
                        creado_por_nombre, resumen, estado
                    ) VALUES (
                        @NumeroIncidente, COALESCE(@Fecha, CURRENT_DATE), 
                        @HoraSalida, @HoraEntrada, @SolicitudTipo,
                        @Paciente, @Edad, @Genero, @Solicitante, @Acompanante, @Domicilio, @Fallecio,
                        @Ubicacion, @TipoEmergenciaId, @HospitalDestinoId, @HospitalDestinoNombre,
                        @EstadoEntrega, @UnidadAsignadaId, @UnidadAsignadaNombre, @FormuladoPorId,
                        @CreadoPorNombre, @Resumen, 'Activo'
                    ) RETURNING servicio_id;";

                servicioId = await connection.QuerySingleAsync<int>(sqlEmergencia, new
                {
                    NumeroIncidente = numeroIncidente,
                    Fecha = dto.Fecha,
                    HoraSalida = horaSalida,
                    HoraEntrada = horaEntrada,
                    SolicitudTipo = string.IsNullOrWhiteSpace(dto.SolicitudTipo) ? "Telefónica" : dto.SolicitudTipo,
                    Paciente = dto.Paciente,
                    Edad = dto.Edad,
                    Genero = string.IsNullOrWhiteSpace(dto.Genero) ? "No especificado" : dto.Genero,
                    Solicitante = dto.Solicitante,
                    Acompanante = dto.Acompanante,
                    Domicilio = dto.Domicilio,
                    Fallecio = dto.Fallecio,
                    Ubicacion = dto.Ubicacion,
                    TipoEmergenciaId = dto.TipoEmergenciaId,
                    HospitalDestinoId = dto.HospitalDestinoId,
                    HospitalDestinoNombre = hospitalNombre,
                    EstadoEntrega = dto.EstadoEntrega,
                    UnidadAsignadaId = dto.UnidadAsignadaId,
                    UnidadAsignadaNombre = unidadNombre,
                    FormuladoPorId = dto.FormuladoPorId,
                    CreadoPorNombre = string.IsNullOrWhiteSpace(dto.CreadoPorNombre) ? "Bombero" : dto.CreadoPorNombre,
                    Resumen = dto.Resumen
                }, transaction);

                if (dto.TiposAsistencia != null && dto.TiposAsistencia.Any())
                {
                    foreach (var tipo in dto.TiposAsistencia)
                    {
                        await connection.ExecuteAsync(
                            "INSERT INTO servicio_tipos_asistencia (servicio_id, tipo_asistencia) VALUES (@ServicioId, @Tipo)",
                            new { ServicioId = servicioId, Tipo = tipo }, transaction);
                    }
                }

                if (dto.PersonalAsignado != null && dto.PersonalAsignado.Any())
                {
                    foreach (var personal in dto.PersonalAsignado)
                    {
                        await connection.ExecuteAsync(
                            "INSERT INTO servicio_personal_asignado (servicio_id, personal_id, nombre_personal, rol_servicio_id) VALUES (@ServicioId, @PersonalId, @NombrePersonal, @RolServicioId)",
                            new { ServicioId = servicioId, PersonalId = (object?)personal.PersonalId ?? DBNull.Value, NombrePersonal = personal.NombrePersonal, RolServicioId = (object?)personal.RolServicioId ?? DBNull.Value }, transaction);
                    }
                }

                if (dto.SignosVitales != null)
                {
                    TimeSpan? horaToma = TimeSpan.TryParse(dto.SignosVitales.HoraToma, out var ht) ? ht : null;
                    await connection.ExecuteAsync(
                        @"INSERT INTO signos_vitales_paciente (servicio_id, presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, saturacion_oxigeno, hora_toma) 
                          VALUES (@ServicioId, @PresionArterial, @FrecuenciaCardiaca, @FrecuenciaRespiratoria, @SaturacionOxigeno, @HoraToma)",
                        new { ServicioId = servicioId,
                              PresionArterial = dto.SignosVitales.PresionArterial != null ? (object)dto.SignosVitales.PresionArterial : DBNull.Value,
                              FrecuenciaCardiaca = dto.SignosVitales.FrecuenciaCardiaca != null ? (object)dto.SignosVitales.FrecuenciaCardiaca : DBNull.Value,
                              FrecuenciaRespiratoria = dto.SignosVitales.FrecuenciaRespiratoria != null ? (object)dto.SignosVitales.FrecuenciaRespiratoria : DBNull.Value,
                              SaturacionOxigeno = dto.SignosVitales.SaturacionOxigeno != null ? (object)dto.SignosVitales.SaturacionOxigeno : DBNull.Value,
                              HoraToma = horaToma }, transaction);
                }

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }

            var creada = await ObtenerEmergenciaPorIdAsync(servicioId);
            return creada!;
        }

        public async Task<EmergenciaResponseDto?> ActualizarEmergenciaAsync(int id, EmergenciaUpdateDto dto)
        {
            using var connection = AbrirConexion();

            var existe = await connection.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM emergencias_servicios WHERE servicio_id = @Id", new { Id = id });

            if (existe == 0) return null;

            using var transaction = connection.BeginTransaction();

            try
            {
                var hospitalNombre = dto.HospitalDestinoNombre;
                if (string.IsNullOrWhiteSpace(hospitalNombre) && dto.HospitalDestinoId.HasValue)
                {
                    hospitalNombre = await connection.QueryFirstOrDefaultAsync<string?>(
                        "SELECT nombre FROM cat_hospitales WHERE hospital_id = @Id",
                        new { Id = dto.HospitalDestinoId.Value }, transaction);
                }

                var unidadNombre = dto.UnidadAsignadaNombre;
                if (string.IsNullOrWhiteSpace(unidadNombre) && dto.UnidadAsignadaId.HasValue)
                {
                    unidadNombre = await connection.QueryFirstOrDefaultAsync<string?>(
                        "SELECT codigo_unidad FROM cat_unidades WHERE unidad_id = @Id",
                        new { Id = dto.UnidadAsignadaId.Value }, transaction);
                }

                TimeSpan? horaSalida = TimeSpan.TryParse(dto.HoraSalida, out var hs) ? hs : null;
                TimeSpan? horaEntrada = TimeSpan.TryParse(dto.HoraEntrada, out var he) ? he : null;

                var sqlUpdate = @"
                    UPDATE emergencias_servicios SET
                        numero_incidente = @NumeroIncidente,
                        fecha = COALESCE(@Fecha, fecha),
                        hora_salida = @HoraSalida,
                        hora_entrada = @HoraEntrada,
                        solicitud_tipo = @SolicitudTipo,
                        paciente = @Paciente,
                        edad = @Edad,
                        genero = @Genero,
                        solicitante = @Solicitante,
                        acompanante = @Acompanante,
                        domicilio = @Domicilio,
                        fallecio = @Fallecio,
                        ubicacion = @Ubicacion,
                        tipo_emergencia_id = @TipoEmergenciaId,
                        hospital_destino_id = @HospitalDestinoId,
                        hospital_destino_nombre = @HospitalDestinoNombre,
                        estado_entrega = @EstadoEntrega,
                        unidad_asignada_id = @UnidadAsignadaId,
                        unidad_asignada_nombre = @UnidadAsignadaNombre,
                        formulado_por_id = @FormuladoPorId,
                        creado_por_nombre = @CreadoPorNombre,
                        resumen = @Resumen,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE servicio_id = @Id";

                await connection.ExecuteAsync(sqlUpdate, new
                {
                    Id = id,
                    NumeroIncidente = dto.NumeroIncidente,
                    Fecha = dto.Fecha,
                    HoraSalida = horaSalida,
                    HoraEntrada = horaEntrada,
                    SolicitudTipo = string.IsNullOrWhiteSpace(dto.SolicitudTipo) ? "Telefónica" : dto.SolicitudTipo,
                    Paciente = dto.Paciente,
                    Edad = dto.Edad,
                    Genero = string.IsNullOrWhiteSpace(dto.Genero) ? "No especificado" : dto.Genero,
                    Solicitante = dto.Solicitante,
                    Acompanante = dto.Acompanante,
                    Domicilio = dto.Domicilio,
                    Fallecio = dto.Fallecio,
                    Ubicacion = dto.Ubicacion,
                    TipoEmergenciaId = dto.TipoEmergenciaId,
                    HospitalDestinoId = dto.HospitalDestinoId,
                    HospitalDestinoNombre = hospitalNombre,
                    EstadoEntrega = dto.EstadoEntrega,
                    UnidadAsignadaId = dto.UnidadAsignadaId,
                    UnidadAsignadaNombre = unidadNombre,
                    FormuladoPorId = dto.FormuladoPorId,
                    CreadoPorNombre = string.IsNullOrWhiteSpace(dto.CreadoPorNombre) ? "Bombero" : dto.CreadoPorNombre,
                    Resumen = dto.Resumen
                }, transaction);

                await connection.ExecuteAsync(
                    "DELETE FROM servicio_tipos_asistencia WHERE servicio_id = @Id", new { Id = id }, transaction);

                if (dto.TiposAsistencia != null && dto.TiposAsistencia.Any())
                {
                    foreach (var tipo in dto.TiposAsistencia)
                    {
                        await connection.ExecuteAsync(
                            "INSERT INTO servicio_tipos_asistencia (servicio_id, tipo_asistencia) VALUES (@ServicioId, @Tipo)",
                            new { ServicioId = id, Tipo = tipo }, transaction);
                    }
                }

                await connection.ExecuteAsync(
                    "DELETE FROM servicio_personal_asignado WHERE servicio_id = @Id", new { Id = id }, transaction);

                if (dto.PersonalAsignado != null && dto.PersonalAsignado.Any())
                {
                    foreach (var personal in dto.PersonalAsignado)
                    {
                        await connection.ExecuteAsync(
                            "INSERT INTO servicio_personal_asignado (servicio_id, personal_id, nombre_personal, rol_servicio_id) VALUES (@ServicioId, @PersonalId, @NombrePersonal, @RolServicioId)",
                            new { ServicioId = id, PersonalId = (object?)personal.PersonalId ?? DBNull.Value, NombrePersonal = personal.NombrePersonal, RolServicioId = (object?)personal.RolServicioId ?? DBNull.Value }, transaction);
                    }
                }

                if (dto.SignosVitales != null)
                {
                    TimeSpan? horaToma = TimeSpan.TryParse(dto.SignosVitales.HoraToma, out var ht) ? ht : null;

                    var existeSignos = await connection.ExecuteScalarAsync<int>(
                        "SELECT COUNT(*) FROM signos_vitales_paciente WHERE servicio_id = @Id", new { Id = id }, transaction);

                    if (existeSignos > 0)
                    {
                        await connection.ExecuteAsync(
                            @"UPDATE signos_vitales_paciente SET
                                presion_arterial = @PresionArterial,
                                frecuencia_cardiaca = @FrecuenciaCardiaca,
                                frecuencia_respiratoria = @FrecuenciaRespiratoria,
                                saturacion_oxigeno = @SaturacionOxigeno,
                                hora_toma = @HoraToma
                              WHERE servicio_id = @Id",
                            new { Id = id,
                                  PresionArterial = dto.SignosVitales.PresionArterial != null ? (object)dto.SignosVitales.PresionArterial : DBNull.Value,
                                  FrecuenciaCardiaca = dto.SignosVitales.FrecuenciaCardiaca != null ? (object)dto.SignosVitales.FrecuenciaCardiaca : DBNull.Value,
                                  FrecuenciaRespiratoria = dto.SignosVitales.FrecuenciaRespiratoria != null ? (object)dto.SignosVitales.FrecuenciaRespiratoria : DBNull.Value,
                                  SaturacionOxigeno = dto.SignosVitales.SaturacionOxigeno != null ? (object)dto.SignosVitales.SaturacionOxigeno : DBNull.Value,
                                  HoraToma = horaToma }, transaction);
                    }
                    else
                    {
                        await connection.ExecuteAsync(
                            @"INSERT INTO signos_vitales_paciente (servicio_id, presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, saturacion_oxigeno, hora_toma) 
                              VALUES (@ServicioId, @PresionArterial, @FrecuenciaCardiaca, @FrecuenciaRespiratoria, @SaturacionOxigeno, @HoraToma)",
                            new { ServicioId = id,
                                  PresionArterial = dto.SignosVitales.PresionArterial != null ? (object)dto.SignosVitales.PresionArterial : DBNull.Value,
                                  FrecuenciaCardiaca = dto.SignosVitales.FrecuenciaCardiaca != null ? (object)dto.SignosVitales.FrecuenciaCardiaca : DBNull.Value,
                                  FrecuenciaRespiratoria = dto.SignosVitales.FrecuenciaRespiratoria != null ? (object)dto.SignosVitales.FrecuenciaRespiratoria : DBNull.Value,
                                  SaturacionOxigeno = dto.SignosVitales.SaturacionOxigeno != null ? (object)dto.SignosVitales.SaturacionOxigeno : DBNull.Value,
                                  HoraToma = horaToma }, transaction);
                    }
                }

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }

            var actualizada = await ObtenerEmergenciaPorIdAsync(id);
            return actualizada;
        }

        public async Task<bool> CambiarEstadoAsync(int id, string estado)
        {
            using var connection = AbrirConexion();

            var sql = @"
                UPDATE emergencias_servicios 
                SET estado = @Estado, updated_at = CURRENT_TIMESTAMP 
                WHERE servicio_id = @Id";

            var filasAfectadas = await connection.ExecuteAsync(sql, new { Id = id, Estado = estado });
            return filasAfectadas > 0;
        }

        public async Task<string> ObtenerSiguienteIncidenteAsync()
        {
            using var connection = AbrirConexion();

            var anioActual = DateTime.Now.Year;
            var sqlUltimo = @"
                SELECT numero_incidente 
                FROM emergencias_servicios 
                WHERE numero_incidente LIKE @Pattern 
                ORDER BY servicio_id DESC 
                LIMIT 1;";

            var ultimoCodigo = await connection.QueryFirstOrDefaultAsync<string>(
                sqlUltimo, 
                new { Pattern = $"INC-{anioActual}-%" });

            int siguienteNumero = 1;
            if (!string.IsNullOrEmpty(ultimoCodigo))
            {
                var partes = ultimoCodigo.Split('-');
                if (partes.Length == 3 && int.TryParse(partes[2], out int actual))
                {
                    siguienteNumero = actual + 1;
                }
            }

            return $"INC-{anioActual}-{siguienteNumero:D3}";
        }
    }
}
