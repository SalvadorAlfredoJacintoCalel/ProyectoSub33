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

        [Column("minimo")]
        public int Minimo { get; set; }

        [Column("maximo")]
        public int Maximo { get; set; }
    }
}