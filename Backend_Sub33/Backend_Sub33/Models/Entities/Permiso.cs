using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend_Sub33.Models;

namespace Backend_Sub33.Models.Entities
{
    [Table("permisos")]
    public class Permiso
    {
        [Key]
        [Column("permiso_id")]
        public int PermisoId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("codigo")]
        public string Codigo { get; set; } = string.Empty;

        [Column("modulo_id")]
        public int ModuloId { get; set; }

        [Column("descripcion")]
        public string? Descripcion { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [ForeignKey("ModuloId")]
        public virtual CatModulo Modulo { get; set; } = null!;

        public ICollection<RolPermiso> RolPermisos { get; set; } = new List<RolPermiso>();
    }
}
