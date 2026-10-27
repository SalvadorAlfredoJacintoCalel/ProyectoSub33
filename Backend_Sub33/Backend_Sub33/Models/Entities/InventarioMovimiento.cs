using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("inventario_movimientos")]
    public class InventarioMovimiento
    {
        [Key]
        [Column("movimiento_id")]
        public int MovimientoId { get; set; }

        [Required]
        [Column("item_id")]
        public int ItemId { get; set; }

        [Required]
        [Column("tipo_mov_id")]
        public int TipoMovId { get; set; }

        [Required]
        [Column("cantidad")]
        public int Cantidad { get; set; }

        [Required]
        [Column("motivo")]
        public string Motivo { get; set; } = string.Empty;

        [Column("responsable_id")]
        public Guid? ResponsableId { get; set; }

        [Column("fecha_hora")]
        public DateTime? FechaHora { get; set; }
    }
}
