using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("cat_rangos")]
    public class CatRango
    {
        [Key]
        [Column("rango_id")]
        public int RangoId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("rango")]
        public string Rango { get; set; } = string.Empty;

        [Column("descripcion")]
        public string? Descripcion { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
