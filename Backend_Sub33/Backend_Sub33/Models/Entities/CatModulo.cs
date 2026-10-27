using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend_Sub33.Models;

namespace Backend_Sub33.Models.Entities
{
    [Table("cat_modulos")]
    public class CatModulo
    {
        [Key]
        [Column("modulo_id")]
        public int ModuloId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("codigo")]
        public string CodigoModulo { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("nombre")]
        public string NombreModulo { get; set; } = string.Empty;

        [Column("descripcion")]
        public string? Descripcion { get; set; }

        public ICollection<Permiso> Permisos { get; set; } = new List<Permiso>();
    }
}
