using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend_Sub33.Models;

namespace Backend_Sub33.Models.Entities
{
    [Table("bitacora_acciones")]
    public class BitacoraAccion
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("accion_id")]
        public long AccionId { get; set; }

        [Column("usuario_id")]
        public Guid? UsuarioId { get; set; }

        [MaxLength(150)]
        [Column("usuario_nombre")]
        public string? UsuarioNombre { get; set; }

        [Required]
        [MaxLength(10)]
        [Column("metodo")]
        public string Metodo { get; set; } = string.Empty;

        [Required]
        [MaxLength(300)]
        [Column("ruta")]
        public string Ruta { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("modulo")]
        public string Modulo { get; set; } = string.Empty;

        [Required]
        [MaxLength(120)]
        [Column("accion")]
        public string Accion { get; set; } = string.Empty;

        [Column("fecha_hora")]
        public DateTime FechaHora { get; set; }

        [ForeignKey("UsuarioId")]
        public virtual Usuario? Usuario { get; set; }
    }
}
