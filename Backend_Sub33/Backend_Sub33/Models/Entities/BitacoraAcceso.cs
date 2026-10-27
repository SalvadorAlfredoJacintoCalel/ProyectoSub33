using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("bitacora_accesos")]
    public class BitacoraAcceso
    {
        [Key]
        [Column("bitacora_id")]
        public int BitacoraId { get; set; }

        [Column("usuario_id")]
        public Guid? UsuarioId { get; set; }

        [MaxLength(45)]
        [Column("ip_origen")]
        public string? IpOrigen { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("evento")]
        public string Evento { get; set; } = string.Empty;

        [Required]
        [Column("exitoso")]
        public bool Exitoso { get; set; }

        [Column("fecha_hora")]
        public DateTime FechaHora { get; set; }

        [ForeignKey("UsuarioId")]
        public virtual Usuario? Usuario { get; set; }
    }
}