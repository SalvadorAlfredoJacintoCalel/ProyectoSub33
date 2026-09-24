using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("configuracion_listas_maestras")]
    public class ConfiguracionListaMaestra
    {
        [Key]
        [Column("lista_id")]
        public int ListaId { get; set; }

        [Required]
        [Column("categoria_id")]
        public int CategoriaId { get; set; }

        [ForeignKey("CategoriaId")]
        public virtual CatCategoriaLista Categoria { get; set; } = null!;

        [Required]
        [MaxLength(150)]
        [Column("opcion")]
        public string Opcion { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("modulo")]
        public string Modulo { get; set; } = string.Empty;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}