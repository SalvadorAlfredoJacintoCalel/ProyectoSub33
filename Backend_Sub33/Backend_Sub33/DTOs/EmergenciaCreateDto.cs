using System.Collections.Generic;

namespace Backend_Sub33.DTOs;

public class EmergenciaCreateDto
{
    public string? NumeroIncidente { get; set; }
    public DateTime? Fecha { get; set; }
    public string? HoraSalida { get; set; }
    public string? HoraEntrada { get; set; }
    public string? SolicitudTipo { get; set; }
    public string Paciente { get; set; } = string.Empty;
    public int? Edad { get; set; }
    public string? Genero { get; set; }
    public string? Solicitante { get; set; }
    public string? Acompanante { get; set; }
    public string? Domicilio { get; set; }
    public bool Fallecio { get; set; }
    public string Ubicacion { get; set; } = string.Empty;
    public string? HospitalDestinoNombre { get; set; }
    public string? EstadoEntrega { get; set; }
    public string? UnidadAsignadaNombre { get; set; }
    public string? CreadoPorNombre { get; set; }
    public string? Resumen { get; set; }
    public List<string> TiposAsistencia { get; set; } = new();
    public List<PersonalAsignadoDto> PersonalAsignado { get; set; } = new();
    public SignosVitalesDto? SignosVitales { get; set; }
}

public class PersonalAsignadoDto
{
    public string NombrePersonal { get; set; } = string.Empty;
    public string RolEnServicio { get; set; } = "Socorrista";
}

public class SignosVitalesDto
{
    public string? PresionArterial { get; set; }
    public int? FrecuenciaCardiaca { get; set; }
    public int? FrecuenciaRespiratoria { get; set; }
    public int? SaturacionOxigeno { get; set; }
    public string? HoraToma { get; set; }
}