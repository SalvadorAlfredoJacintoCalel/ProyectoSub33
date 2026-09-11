using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("cat_tipos_emergencia")]
    public class CatTipoEmergencia
    {
        [Key]
        [Column("tipo_emergencia_id")]
        public int TipoEmergenciaId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [MaxLength(200)]
        [Column("descripcion")]
        public string? Descripcion { get; set; }
    }
}