using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend_Sub33.Models.Entities;

namespace Backend_Sub33.Models;

[Table("rol_permisos")]
public class RolPermiso
{
    [Column("rol_id")]
    public int RolId { get; set; }

    [Column("permiso_id")]
    public int PermisoId { get; set; }

    [ForeignKey("RolId")]
    public virtual Rol Rol { get; set; } = null!;

    [ForeignKey("PermisoId")]
    public virtual Permiso Permiso { get; set; } = null!;
}
