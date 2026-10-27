using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("equipo_unidades")]
    public class EquipoUnidad
    {
        [Column("unidad_id")]
        public int UnidadId { get; set; }

        [Column("item_id")]
        public int ItemId { get; set; }

        [Required]
        [Column("cantidad_asignada")]
        public int CantidadAsignada { get; set; }
    }
}
