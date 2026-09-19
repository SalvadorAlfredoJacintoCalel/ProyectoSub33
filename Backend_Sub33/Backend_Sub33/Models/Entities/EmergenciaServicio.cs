using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("emergencias_servicios")]
    public class EmergenciaServicio
    {
        [Key]
        [Column("servicio_id")]
        public int ServicioId { get; set; }

        [Required]
        [MaxLength(30)]
        [Column("numero_incidente")]
        public string NumeroIncidente { get; set; } = string.Empty;

        [Required]
        [Column("fecha")]
        public DateTime Fecha { get; set; } = DateTime.Today;

        [Column("hora_salida")]
        public TimeSpan? HoraSalida { get; set; }

        [Column("hora_entrada")]
        public TimeSpan? HoraEntrada { get; set; }

        [MaxLength(50)]
        [Column("solicitud_tipo")]
        public string SolicitudTipo { get; set; } = "Telefónica";

        [Required]
        [MaxLength(200)]
        [Column("paciente")]
        public string Paciente { get; set; } = string.Empty;

        [Column("edad")]
        public int? Edad { get; set; }

        [MaxLength(20)]
        [Column("genero")]
        public string Genero { get; set; } = "No especificado";

        [MaxLength(200)]
        [Column("solicitante")]
        public string? Solicitante { get; set; }

        [MaxLength(200)]
        [Column("acompanante")]
        public string? Acompanante { get; set; }

        [Column("domicilio")]
        public string? Domicilio { get; set; }

        [Column("fallecio")]
        public bool Fallecio { get; set; } = false;

        [Required]
        [Column("ubicacion")]
        public string Ubicacion { get; set; } = string.Empty;

        [Column("tipo_emergencia_id")]
        public int? TipoEmergenciaId { get; set; }

        [Column("hospital_destino_id")]
        public int? HospitalDestinoId { get; set; }

        [MaxLength(150)]
        [Column("hospital_destino_nombre")]
        public string? HospitalDestinoNombre { get; set; }

        [MaxLength(100)]
        [Column("estado_entrega")]
        public string? EstadoEntrega { get; set; }

        [Column("unidad_asignada_id")]
        public int? UnidadAsignadaId { get; set; }

        [Column("formulado_por_id")]
        public Guid? FormuladoPorId { get; set; }

        [MaxLength(150)]
        [Column("creado_por_nombre")]
        public string CreadoPorNombre { get; set; } = "Bombero";

        [Column("resumen")]
        public string? Resumen { get; set; }

        [MaxLength(10)]
        [Column("estado")]
        public string Estado { get; set; } = "Activo";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        [ForeignKey("TipoEmergenciaId")]
        public virtual CatTipoEmergencia? TipoEmergencia { get; set; }

        [ForeignKey("HospitalDestinoId")]
        public virtual CatHospital? HospitalDestino { get; set; }

        [ForeignKey("FormuladoPorId")]
        public virtual Personal? FormuladoPor { get; set; }

        public virtual ICollection<RevisionNuevaOpcion> Revisiones { get; set; } = new List<RevisionNuevaOpcion>();
        public virtual ICollection<ServicioTipoAsistencia> TiposAsistencia { get; set; } = new List<ServicioTipoAsistencia>();
        public virtual ICollection<ServicioPersonalAsignado> PersonalAsignado { get; set; } = new List<ServicioPersonalAsignado>();
        public virtual SignosVitalesPaciente? SignosVitales { get; set; }
    }
}