using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("servicio_personal_asignado")]
    public class ServicioPersonalAsignado
    {
        [Column("servicio_id")]
        public int ServicioId { get; set; }

        [Column("personal_id")]
        public Guid? PersonalId { get; set; }

        [Required]
        [MaxLength(150)]
        [Column("nombre_personal")]
        public string NombrePersonal { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("rol_en_servicio")]
        public string RolEnServicio { get; set; } = "Socorrista";

        [ForeignKey("ServicioId")]
        public virtual EmergenciaServicio? Servicio { get; set; }

        [ForeignKey("PersonalId")]
        public virtual Personal? Personal { get; set; }
    }
}