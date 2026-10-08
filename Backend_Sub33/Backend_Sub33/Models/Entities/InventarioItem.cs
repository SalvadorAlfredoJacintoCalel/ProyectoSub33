using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("inventario_items")]
    public class InventarioItem
    {
        [Key]
        [Column("item_id")]
        public int ItemId { get; set; }

        [Required]
        [Column("categoria_inv_id")]
        public int CategoriaInvId { get; set; }

        [Column("proveedor_id")]
        public int? ProveedorId { get; set; }

        [MaxLength(100)]
        [Column("codigo_barras")]
        public string? CodigoBarras { get; set; }

        [Required]
        [MaxLength(200)]
        [Column("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        [Column("stock_actual")]
        public int StockActual { get; set; }

        [Required]
        [Column("stock_minimo")]
        public int StockMinimo { get; set; }

        [MaxLength(50)]
        [Column("unidad_medida")]
        public string? UnidadMedida { get; set; }

        [Column("donacion_id")]
        public int? DonacionId { get; set; }

        [MaxLength(20)]
        [Column("origen")]
        public string Origen { get; set; } = "Compra Propia";

        [MaxLength(150)]
        [Column("nombre_donante")]
        public string? NombreDonante { get; set; }

        [MaxLength(50)]
        [Column("no_recibo")]
        public string? NoRecibo { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }
    }
}
