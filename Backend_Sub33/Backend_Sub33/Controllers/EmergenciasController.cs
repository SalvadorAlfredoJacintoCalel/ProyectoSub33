using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Dapper;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs;

namespace Backend_Sub33.Controllers
{
    [ApiController]
    [Route("api/emergencias")]
    public class EmergenciasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmergenciasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Registrar([FromBody] EmergenciaCreateDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Datos de emergencia inválidos.");
            }

            string numeroIncidente = dto.NumeroIncidente?.Trim();
            string numeroIncidenteGenerado = null;

            TimeSpan? horaSalida = TimeSpan.TryParse(dto.HoraSalida, out var hs) ? hs : null;
            TimeSpan? horaEntrada = TimeSpan.TryParse(dto.HoraEntrada, out var he) ? he : null;

            using var connection = _context.Database.GetDbConnection();
            connection.Open();

            var dbTransaction = connection.BeginTransaction();

            try
            {
                // LÓGICA DE CORRELATIVO AUTOMÁTICO (Evitar Error 23505)
                // Si no viene número de incidente, generar el siguiente de forma automática
                if (string.IsNullOrEmpty(numeroIncidente))
                {
                    // 1. Consultar el número de incidente más reciente para el año actual
                    var anioActual = DateTime.Now.Year;
                    var sqlUltimoIncidente = @"
                        SELECT numero_incidente 
                        FROM emergencias_servicios 
                        WHERE numero_incidente LIKE @Pattern 
                        ORDER BY servicio_id DESC 
                        LIMIT 1;";
                    var ultimoCodigo = await connection.QueryFirstOrDefaultAsync(
                        sqlUltimoIncidente,
                        new { Pattern = $"INC-{anioActual}-%" },
                        dbTransaction
                    );

                    int siguienteNumero = 1;
                    if (ultimoCodigo != null && !string.IsNullOrEmpty(ultimoCodigo.ToString()))
                    {
                        var partes = ultimoCodigo.ToString().Split('-');
                        if (partes.Length == 3)
                        {
                            if (int.TryParse(partes[2], out int parsedActual))
                            {
                                siguienteNumero = parsedActual + 1;
                            }
                        }
                    }

                    // 2. Asignar siempre el correlativo autogenerado (ejemplo: INC-2026-017)
                    numeroIncidenteGenerado = $"INC-{anioActual}-{siguienteNumero:D3}";
                }
                else
                {
                    numeroIncidenteGenerado = numeroIncidente;
                }

                // 1. Dejar que PostgreSQL genere el autoincremental con SERIAL y devuelva el entero generado
                var sqlEmergencia = @"
                    INSERT INTO emergencias_servicios (
                        numero_incidente, fecha, hora_salida, hora_entrada, solicitud_tipo,
                        paciente, edad, genero, solicitante, acompanante, domicilio, fallecio,
                        ubicacion, hospital_destino_nombre, estado_entrega, unidad_asignada_nombre,
                        creado_por_nombre, resumen
                    ) VALUES (
                        @NumeroIncidente, COALESCE(@Fecha, CURRENT_DATE), 
                        @HoraSalida, @HoraEntrada, @SolicitudTipo,
                        @Paciente, @Edad, @Genero, @Solicitante, @Acompanante, @Domicilio, @Fallecio,
                        @Ubicacion, @HospitalDestinoNombre, @EstadoEntrega, @UnidadAsignadaNombre,
                        @CreadoPorNombre, @Resumen
                    ) RETURNING servicio_id;";

                // 2. Ejecutar la consulta asegurando que el tipo de retorno sea un int explícito
                int servicioId = await connection.QuerySingleAsync<int>(sqlEmergencia, new
                {
                    NumeroIncidente = numeroIncidenteGenerado,
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
                    HospitalDestinoNombre = dto.HospitalDestinoNombre,
                    EstadoEntrega = dto.EstadoEntrega,
                    UnidadAsignadaNombre = dto.UnidadAsignadaNombre,
                    CreadoPorNombre = string.IsNullOrWhiteSpace(dto.CreadoPorNombre) ? "Bombero" : dto.CreadoPorNombre,
                    Resumen = dto.Resumen
                }, dbTransaction);

                // Paso 2: Insertar cada tipo de asistencia en servicio_tipos_asistencia
                if (dto.TiposAsistencia != null && dto.TiposAsistencia.Any())
                {
                    foreach (var tipo in dto.TiposAsistencia)
                    {
                        await connection.ExecuteAsync(
                            "INSERT INTO servicio_tipos_asistencia (servicio_id, tipo_asistencia) VALUES (@ServicioId, @Tipo)",
                            new { ServicioId = (int)servicioId, Tipo = tipo }, dbTransaction);
                    }
                }

                // Paso 3: Insertar personal asignado en servicio_personal_asignado
                if (dto.PersonalAsignado != null && dto.PersonalAsignado.Any())
                {
                    foreach (var personal in dto.PersonalAsignado)
                    {
                        await connection.ExecuteAsync(
                            "INSERT INTO servicio_personal_asignado (servicio_id, nombre_personal, rol_en_servicio) VALUES (@ServicioId, @NombrePersonal, @RolEnServicio)",
                            new { ServicioId = (int)servicioId, NombrePersonal = personal.NombrePersonal, RolEnServicio = string.IsNullOrWhiteSpace(personal.RolEnServicio) ? "Socorrista" : personal.RolEnServicio }, dbTransaction);
                    }
                }

                // Paso 4: Insertar signos vitales si están presentes
                TimeSpan? horaToma = TimeSpan.TryParse(dto.SignosVitales?.HoraToma, out var ht) ? ht : null;
                if (dto.SignosVitales != null)
                {
                    await connection.ExecuteAsync(
                        "INSERT INTO signos_vitales_paciente (servicio_id, presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, saturacion_oxigeno, hora_toma) VALUES (@ServicioId, @PresionArterial, @FrecuenciaCardiaca, @FrecuenciaRespiratoria, @SaturacionOxigeno, @HoraToma)",
                        new { ServicioId = (int)servicioId,
                              PresionArterial = dto.SignosVitales.PresionArterial != null ? (object)dto.SignosVitales.PresionArterial : DBNull.Value,
                              FrecuenciaCardiaca = dto.SignosVitales.FrecuenciaCardiaca != null ? (object)dto.SignosVitales.FrecuenciaCardiaca : DBNull.Value,
                              FrecuenciaRespiratoria = dto.SignosVitales.FrecuenciaRespiratoria != null ? (object)dto.SignosVitales.FrecuenciaRespiratoria : DBNull.Value,
                              SaturacionOxigeno = dto.SignosVitales.SaturacionOxigeno != null ? (object)dto.SignosVitales.SaturacionOxigeno : DBNull.Value,
                              HoraToma = horaToma }, dbTransaction);
                }

                dbTransaction.Commit();

                return Ok(new
                {
                    exito = true,
                    mensaje = "Emergencia registrada exitosamente.",
                    servicioId = servicioId,
                    numeroIncidente = numeroIncidente
                });
            }
            catch (Exception ex)
            {
                dbTransaction.Rollback();
                Console.WriteLine($"[ERROR EMERGENCIAS]: {ex.Message}");
                if (ex.InnerException != null) 
                    Console.WriteLine($"[INNER ERROR]: {ex.InnerException.Message}");

                return StatusCode(500, new
                {
                    exito = false,
                    mensaje = $"Error Backend: {ex.Message}",
                    detalle = ex.InnerException?.Message
                });
            }
            finally
            {
                connection.Close();
            }
        }

        [HttpGet("siguiente-incidente")]
        public async Task<IActionResult> ObtenerSiguienteIncidente()
        {
            using var connection = _context.Database.GetDbConnection();
            var anioActual = DateTime.Now.Year;
            var sqlUltimo = @"
                SELECT numero_incidente 
                FROM emergencias_servicios 
                WHERE numero_incidente LIKE @Pattern 
                ORDER BY servicio_id DESC 
                LIMIT 1;";

            var ultimoCodigo = await connection.QueryFirstOrDefaultAsync<string>(
                sqlUltimo, 
                new { Pattern = $"INC-{anioActual}-%" }
            );
            int siguienteNumero = 1;
            if (!string.IsNullOrEmpty(ultimoCodigo))
            {
                var partes = ultimoCodigo.Split('-');
                if (partes.Length == 3 && int.TryParse(partes[2], out int actual))
                {
                    siguienteNumero = actual + 1;
                }
            }
            string siguienteCodigo = $"INC-{anioActual}-{siguienteNumero:D3}";
            return Ok(new { numeroIncidente = siguienteCodigo });
        }
    }
}