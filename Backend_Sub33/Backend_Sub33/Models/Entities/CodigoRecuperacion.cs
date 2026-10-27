using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("codigos_recuperacion")]
    public class CodigoRecuperacion
    {
        [Key]
        [Column("codigo_id")]
        public int CodigoId { get; set; }

        [Required]
        [Column("usuario_id")]
        public Guid UsuarioId { get; set; }

        [MaxLength(64)]
        [Column("codigo_otp_hash")]
        public string? CodigoOtpHash { get; set; }

        [MaxLength(20)]
        [Column("telefono_destino")]
        public string? TelefonoDestino { get; set; }

        [MaxLength(255)]
        [Column("email_destino")]
        public string? EmailDestino { get; set; }

        [Required]
        [Column("expira_en")]
        public DateTime ExpiraEn { get; set; }

        [Column("usado")]
        public bool Usado { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [ForeignKey("UsuarioId")]
        public virtual Usuario? Usuario { get; set; }
    }
}
