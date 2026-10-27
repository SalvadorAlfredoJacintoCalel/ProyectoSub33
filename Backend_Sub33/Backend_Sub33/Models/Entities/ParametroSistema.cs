using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("parametros_sistema")]
    public class ParametroSistema
    {
        [Key]
        [Column("parametro_id")]
        public int ParametroId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("clave")]
        public string Clave { get; set; } = string.Empty;

        [Required]
        [Column("valor")]
        public string Valor { get; set; } = string.Empty;

        [Column("descripcion")]
        public string? Descripcion { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }
    }
}