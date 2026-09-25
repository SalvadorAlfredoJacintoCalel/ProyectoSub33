using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("cat_unidades")]
    public class CatUnidad
    {
        [Key]
        [Column("unidad_id")]
        public int UnidadId { get; set; }

        [Required]
        [MaxLength(20)]
        [Column("codigo_unidad")]
        public string CodigoUnidad { get; set; } = string.Empty;

        [Column("tipo_unidad_id")]
        public int TipoUnidadId { get; set; }

        [MaxLength(15)]
        [Column("placa")]
        public string? Placa { get; set; }

        [MaxLength(30)]
        [Column("estado")]
        public string Estado { get; set; } = "Disponible";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
