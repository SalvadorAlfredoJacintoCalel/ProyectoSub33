using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend_Sub33.Models.Entities;

namespace Backend_Sub33.Models;

[Table("usuario_permisos")]
public class UsuarioPermiso
{
    [Column("usuario_id")]
    public Guid UsuarioId { get; set; }

    [Column("permiso_id")]
    public int PermisoId { get; set; }

    [ForeignKey("UsuarioId")]
    public virtual Usuario Usuario { get; set; } = null!;

    [ForeignKey("PermisoId")]
    public virtual Permiso Permiso { get; set; } = null!;
}
