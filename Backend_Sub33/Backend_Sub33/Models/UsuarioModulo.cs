using System;
using System.ComponentModel.DataAnnotations.Schema;
using Backend_Sub33.Models.Entities;

namespace Backend_Sub33.Models;

[Table("usuario_modulos")]
public class UsuarioModulo
{
    [Column("usuario_id")]
    public Guid UsuarioId { get; set; }

    [Column("modulo_id")]
    public int ModuloId { get; set; }

    [ForeignKey("UsuarioId")]
    public virtual Usuario Usuario { get; set; } = null!;

    [ForeignKey("ModuloId")]
    public virtual CatModulo Modulo { get; set; } = null!;
}
