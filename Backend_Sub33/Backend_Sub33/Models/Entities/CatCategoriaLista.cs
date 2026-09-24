using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("cat_categorias_listas")]
    public class CatCategoriaLista
    {
        [Key]
        [Column("categoria_id")]
        public int CategoriaId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("codigo")]
        public string Codigo { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("modulo")]
        public string Modulo { get; set; } = "GENERAL";

        [Column("descripcion")]
        public string? Descripcion { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        public virtual ICollection<ConfiguracionListaMaestra> Opciones { get; set; } = new List<ConfiguracionListaMaestra>();
    }
}