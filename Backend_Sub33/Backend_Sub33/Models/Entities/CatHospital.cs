using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("cat_hospitales")]
    public class CatHospital
    {
        [Key]
        [Column("hospital_id")]
        public int HospitalId { get; set; }

        [Required]
        [MaxLength(150)]
        [Column("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [MaxLength(200)]
        [Column("direccion")]
        public string? Direccion { get; set; }

        [MaxLength(100)]
        [Column("ciudad")]
        public string? Ciudad { get; set; }

        [MaxLength(20)]
        [Column("codigo_postal")]
        public string? CodigoPostal { get; set; }
    }
}