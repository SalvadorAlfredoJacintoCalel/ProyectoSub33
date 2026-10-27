using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("finanzas_transacciones")]
    public class FinanzaTransaccion
    {
        [Key]
        [Column("transaccion_id")]
        public long TransaccionId { get; set; }

        [Required]
        [MaxLength(20)]
        [Column("tipo")]
        public string Tipo { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        [Column("descripcion")]
        public string Descripcion { get; set; } = string.Empty;

        [Column("monto")]
        public decimal Monto { get; set; }

        [Column("fecha")]
        public DateTime Fecha { get; set; } = DateTime.Today;

        [MaxLength(100)]
        [Column("referencia")]
        public string? Referencia { get; set; }

        [Column("responsable_id")]
        public Guid ResponsableId { get; set; }

        [Required]
        [MaxLength(200)]
        [Column("responsable_nombre")]
        public string ResponsableNombre { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("modulo_origen")]
        public string? ModuloOrigen { get; set; }

        [MaxLength(100)]
        [Column("referencia_origen")]
        public string? ReferenciaOrigen { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
