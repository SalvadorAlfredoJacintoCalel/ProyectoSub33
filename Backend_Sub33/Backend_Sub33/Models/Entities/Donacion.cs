using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("donaciones")]
    public class Donacion
    {
        [Key]
        [Column("donacion_id")]
        public int DonacionId { get; set; }

        [Required]
        [Column("fecha")]
        public DateTime Fecha { get; set; } = DateTime.Today;

        [Required]
        [MaxLength(50)]
        [Column("no_recibo")]
        public string NoRecibo { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        [Column("donante")]
        public string Donante { get; set; } = string.Empty;

        [MaxLength(20)]
        [Column("dpi_nit")]
        public string? DpiNit { get; set; }

        [MaxLength(20)]
        [Column("telefono")]
        public string? Telefono { get; set; }

        [Required]
        [MaxLength(20)]
        [Column("tipo")]
        public string Tipo { get; set; } = "Monetaria";

        [MaxLength(50)]
        [Column("categoria")]
        public string? Categoria { get; set; }

        [Column("descripcion")]
        public string? Descripcion { get; set; }

        [Column("monto")]
        public decimal Monto { get; set; }

        [MaxLength(20)]
        [Column("estado")]
        public string Estado { get; set; } = "Pendiente";

        [MaxLength(20)]
        [Column("metodo_pago")]
        public string? MetodoPago { get; set; }

        [MaxLength(50)]
        [Column("no_comprobante")]
        public string? NoComprobante { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
