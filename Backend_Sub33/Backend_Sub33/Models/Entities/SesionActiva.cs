using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("sesiones_activas")]
    public class SesionActiva
    {
        [Key]
        [Column("sesion_id")]
        public Guid SesionId { get; set; }

        [Required]
        [Column("usuario_id")]
        public Guid UsuarioId { get; set; }

        [Required]
        [MaxLength(255)]
        [Column("token_hash")]
        public string TokenHash { get; set; } = string.Empty;

        [Required]
        [Column("expira_en")]
        public DateTime ExpiraEn { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [ForeignKey("UsuarioId")]
        public virtual Usuario? Usuario { get; set; }
    }
}