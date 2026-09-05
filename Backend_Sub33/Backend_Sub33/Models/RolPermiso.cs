using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models;

[Table("rol_permisos")]
public class RolPermiso
{
    [Column("rol_id")]
    public string RolId { get; set; } = string.Empty;

    [Column("permiso_id")]
    public Guid PermisoId { get; set; }

    [ForeignKey("RolId")]
    public virtual Rol Rol { get; set; } = null!;

    [ForeignKey("PermisoId")]
    public virtual Permiso Permiso { get; set; } = null!;
}