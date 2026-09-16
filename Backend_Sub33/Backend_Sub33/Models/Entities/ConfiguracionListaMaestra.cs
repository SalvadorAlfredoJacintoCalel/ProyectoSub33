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
        [MaxLength(100)]
        [Column("categoria")]
        public string Categoria { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("opcion")]
        public string Opcion { get; set; } = string.Empty;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}