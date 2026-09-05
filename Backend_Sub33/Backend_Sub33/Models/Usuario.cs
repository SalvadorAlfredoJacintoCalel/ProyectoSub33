using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models;

[Table("usuarios")]
public class Usuario
{
    [Key]
    [Column("usuario_id")]
    public Guid UsuarioId { get; set; }

    [Column("personal_id")]
    public Guid? PersonalId { get; set; }

    [Column("username")]
    public string Username { get; set; } = string.Empty;

    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    [NotMapped]
    public string NombreCompleto { get; set; } = string.Empty;

    [Column("estado")]
    public bool Estado { get; set; }

    [Column("ultimo_login")]
    public DateTime? UltimoLogin { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [ForeignKey("PersonalId")]
    public virtual Personal? Personal { get; set; }

    public ICollection<UsuarioRol> UsuarioRoles { get; set; } = new List<UsuarioRol>();
}