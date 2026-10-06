using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs
{
    public class EmergenciaUpdateDto
    {
        [Required(ErrorMessage = "El número de incidente es obligatorio")]
        public string NumeroIncidente { get; set; } = string.Empty;

        public DateTime? Fecha { get; set; }
        public string? HoraSalida { get; set; }
        public string? HoraEntrada { get; set; }
        public string? SolicitudTipo { get; set; }

        [Required(ErrorMessage = "El nombre del paciente es obligatorio")]
        public string Paciente { get; set; } = string.Empty;

        [Range(0, 120, ErrorMessage = "La edad debe estar entre 0 y 120")]
        public int? Edad { get; set; }

        public string? Genero { get; set; }
        public string? Solicitante { get; set; }
        public string? Acompanante { get; set; }
        public string? Domicilio { get; set; }
        public bool Fallecio { get; set; }

        [Required(ErrorMessage = "La ubicación es obligatoria")]
        public string Ubicacion { get; set; } = string.Empty;

        public int? TipoEmergenciaId { get; set; }
        public int? HospitalDestinoId { get; set; }
        public string? HospitalDestinoNombre { get; set; }
        public string? EstadoEntrega { get; set; }
        public int? UnidadAsignadaId { get; set; }
        public string? UnidadAsignadaNombre { get; set; }
        public Guid? FormuladoPorId { get; set; }
        public string? CreadoPorNombre { get; set; }
        public string? Resumen { get; set; }
        public List<string> TiposAsistencia { get; set; } = new();
        public List<PersonalAsignadoDto> PersonalAsignado { get; set; } = new();
        public SignosVitalesDto? SignosVitales { get; set; }
    }

    public class EmergenciaResponseDto
    {
        public int ServicioId { get; set; }
        public string NumeroIncidente { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
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
        public int? TipoEmergenciaId { get; set; }
        public int? HospitalDestinoId { get; set; }
        public string? HospitalDestinoNombre { get; set; }
        public string? EstadoEntrega { get; set; }
        public int? UnidadAsignadaId { get; set; }
        public string? UnidadAsignadaNombre { get; set; }
        public Guid? FormuladoPorId { get; set; }
        public string? CreadoPorNombre { get; set; }
        public string? Resumen { get; set; }
        public string Estado { get; set; } = "Activo";
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaModificacion { get; set; }
        public List<string> TiposAsistencia { get; set; } = new();
        public List<PersonalAsignadoDto> PersonalAsignado { get; set; } = new();
        public SignosVitalesDto? SignosVitales { get; set; }
    }

    public class EmergenciaListResponseDto
    {
        public List<EmergenciaListItemDto> Items { get; set; } = new();
        public int TotalItems { get; set; }
        public int PaginaActual { get; set; }
        public int TamanoPagina { get; set; }
        public int TotalPaginas { get; set; }
        public bool TienePaginaAnterior { get; set; }
        public bool TienePaginaSiguiente { get; set; }
    }

    public class EmergenciaListItemDto
    {
        public int ServicioId { get; set; }
        public string NumeroIncidente { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
        public string? HoraSalida { get; set; }
        public string? HoraEntrada { get; set; }
        public string? SolicitudTipo { get; set; }
        public string Paciente { get; set; } = string.Empty;
        public int? Edad { get; set; }
        public string? Genero { get; set; }
        public string Ubicacion { get; set; } = string.Empty;
        public string? HospitalDestinoNombre { get; set; }
        public string? UnidadAsignadaNombre { get; set; }
        public string Estado { get; set; } = "Activo";
        public string TiposAsistenciaRaw { get; set; } = string.Empty;
        public List<string> TiposAsistencia { get; set; } = new();
    }

    public class EmergenciaFiltrosDto
    {
        public string? Busqueda { get; set; }
        public string? Unidad { get; set; }
        public string? Tipo { get; set; }
        public string? Piloto { get; set; }
        public DateTime? Desde { get; set; }
        public DateTime? Hasta { get; set; }
        public string? Estado { get; set; }
        public int Pagina { get; set; } = 1;
        public int TamanoPagina { get; set; } = 10;
    }

    public class CambiarEstadoDto
    {
        [Required(ErrorMessage = "El estado es obligatorio")]
        [RegularExpression("^(Activo|Inactivo)$", ErrorMessage = "El estado debe ser 'Activo' o 'Inactivo'")]
        public string Estado { get; set; } = string.Empty;
    }
}
