using System;
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
        [Column("tipo")]
        public string Tipo { get; set; } = string.Empty;

        [Column("descripcion")]
        public string? Descripcion { get; set; }

        [Column("requiere_unidad")]
        public bool RequiereUnidad { get; set; }

        [MaxLength(7)]
        [Column("color_hex")]
        public string? ColorHex { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
