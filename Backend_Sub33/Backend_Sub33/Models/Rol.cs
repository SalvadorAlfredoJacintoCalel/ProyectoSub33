using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models;

[Table("roles")]
public class Rol
{
    [Key]
    [Column("rol_id")]
    public string RolId { get; set; } = string.Empty;

    [Column("nombre")]
    public string Nombre { get; set; } = string.Empty;

    [Column("descripcion")]
    public string? Descripcion { get; set; }

    public ICollection<UsuarioRol> UsuarioRoles { get; set; } = new List<UsuarioRol>();
    public ICollection<RolPermiso> RolPermisos { get; set; } = new List<RolPermiso>();
}