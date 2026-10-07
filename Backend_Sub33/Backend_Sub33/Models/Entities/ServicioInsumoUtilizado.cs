using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("servicio_insumos_utilizados")]
    public class ServicioInsumoUtilizado
    {
        [Column("servicio_id")]
        public int ServicioId { get; set; }

        [Column("item_id")]
        public int ItemId { get; set; }

        [Required]
        [Column("cantidad")]
        public int Cantidad { get; set; }
    }
}
