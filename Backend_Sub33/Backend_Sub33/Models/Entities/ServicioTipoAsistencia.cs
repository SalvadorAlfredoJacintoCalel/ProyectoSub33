using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("servicio_tipos_asistencia")]
    public class ServicioTipoAsistencia
    {
        [Column("servicio_id")]
        public int ServicioId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("tipo_asistencia")]
        public string TipoAsistencia { get; set; } = string.Empty;

        [ForeignKey("ServicioId")]
        public virtual EmergenciaServicio? Servicio { get; set; }
    }
}