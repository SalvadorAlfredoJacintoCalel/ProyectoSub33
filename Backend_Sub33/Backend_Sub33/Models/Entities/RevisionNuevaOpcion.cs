using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models.Entities
{
    [Table("revision_nuevas_opciones")]
    public class RevisionNuevaOpcion
    {
        [Key]
        [Column("revision_id")]
        public int RevisionId { get; set; }

        [Column("servicio_id")]
        public int? ServicioId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("categoria")]
        public string Categoria { get; set; } = string.Empty;

        [Required]
        [Column("texto_observacion")]
        public string TextoObservacion { get; set; } = string.Empty;

        [Column("revisado")]
        public bool Revisado { get; set; } = false;

        [Column("atendido_por_usuario_id")]
        public Guid? AtendidoPorUsuarioId { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [ForeignKey("ServicioId")]
        public virtual EmergenciaServicio? Servicio { get; set; }

        [ForeignKey("AtendidoPorUsuarioId")]
        public virtual Usuario? AtendidoPorUsuario { get; set; }
    }
}