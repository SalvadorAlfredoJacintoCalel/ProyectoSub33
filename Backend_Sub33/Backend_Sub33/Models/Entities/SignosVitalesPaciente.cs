using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("signos_vitales_paciente")]
    public class SignosVitalesPaciente
    {
        [Key]
        [Column("signo_id")]
        public int SignoId { get; set; }

        [Required]
        [Column("servicio_id")]
        public int ServicioId { get; set; }

        [MaxLength(20)]
        [Column("presion_arterial")]
        public string? PresionArterial { get; set; }

        [Column("frecuencia_cardiaca")]
        public int? FrecuenciaCardiaca { get; set; }

        [Column("frecuencia_respiratoria")]
        public int? FrecuenciaRespiratoria { get; set; }

        [Column("saturacion_oxigeno")]
        public int? SaturacionOxigeno { get; set; }

        [Column("hora_toma")]
        public TimeSpan HoraToma { get; set; } = DateTime.Now.TimeOfDay;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [ForeignKey("ServicioId")]
        public virtual EmergenciaServicio? Servicio { get; set; }
    }
}