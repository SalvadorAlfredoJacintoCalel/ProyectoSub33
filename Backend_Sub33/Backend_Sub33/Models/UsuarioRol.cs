using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models;

[Table("usuario_roles")]
public class UsuarioRol
{
    [Column("usuario_id")]
    public Guid UsuarioId { get; set; }

    [Column("rol_id")]
    public string RolId { get; set; } = string.Empty;

    [ForeignKey("UsuarioId")]
    public virtual Usuario Usuario { get; set; } = null!;

    [ForeignKey("RolId")]
    public virtual Rol Rol { get; set; } = null!;
}