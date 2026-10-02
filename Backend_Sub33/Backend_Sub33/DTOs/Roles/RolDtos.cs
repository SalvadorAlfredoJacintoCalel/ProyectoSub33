using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs.Roles;

public class RolResponseDto
{
    public int RolId { get; init; }
    public string Nombre { get; init; } = string.Empty;
    public string? Descripcion { get; init; }
}

public class CreateRolDto
{
    [Required(ErrorMessage = "El nombre del rol es requerido")]
    [MaxLength(50)]
    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }
}

public class UpdateRolDto
{
    [MaxLength(50)]
    public string? Nombre { get; set; }

    public string? Descripcion { get; set; }
}
