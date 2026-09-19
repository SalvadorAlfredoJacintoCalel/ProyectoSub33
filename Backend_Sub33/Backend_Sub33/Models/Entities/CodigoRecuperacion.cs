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

        [Required]
        [MaxLength(6)]
        [Column("codigo_otp")]
        public string CodigoOtp { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        [Column("telefono_destino")]
        public string TelefonoDestino { get; set; } = string.Empty;

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