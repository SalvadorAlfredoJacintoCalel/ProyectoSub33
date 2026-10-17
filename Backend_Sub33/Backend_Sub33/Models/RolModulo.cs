using System.ComponentModel.DataAnnotations.Schema;
using Backend_Sub33.Models.Entities;

namespace Backend_Sub33.Models;

[Table("rol_modulo")]
public class RolModulo
{
    [Column("rol_id")]
    public int RolId { get; set; }

    [Column("modulo_id")]
    public int ModuloId { get; set; }

    [ForeignKey("RolId")]
    public virtual Rol Rol { get; set; } = null!;

    [ForeignKey("ModuloId")]
    public virtual CatModulo Modulo { get; set; } = null!;
}
