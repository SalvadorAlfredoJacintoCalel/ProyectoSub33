using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models;

[Table("permisos")]
public class Permiso
{
    [Key]
    [Column("permiso_id")]
    public Guid PermisoId { get; set; }

    [Column("nombre")]
    public string Codigo { get; set; } = string.Empty;

    [Column("descripcion")]
    public string? Descripcion { get; set; }

    public ICollection<RolPermiso> RolPermisos { get; set; } = new List<RolPermiso>();
}