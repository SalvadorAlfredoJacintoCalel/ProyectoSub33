using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("materiales_donacion")]
    public class MaterialDonacion
    {
        [Key]
        [Column("material_id")]
        public int MaterialId { get; set; }

        [Required]
        [Column("donacion_id")]
        public int DonacionId { get; set; }

        [Required]
        [MaxLength(200)]
        [Column("descripcion")]
        public string Descripcion { get; set; } = string.Empty;

        [Required]
        [Column("cantidad")]
        public int Cantidad { get; set; } = 1;

        [Column("valor_estimado")]
        public decimal ValorEstimado { get; set; }

        [MaxLength(50)]
        [Column("categoria")]
        public string? Categoria { get; set; }
    }
}
