using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs.Catalogos;

public class RangoResponseDto
{
    public int RangoId { get; init; }
    public string Rango { get; init; } = string.Empty;
    public string? Descripcion { get; init; }
}

public class CreateRangoDto
{
    [Required(ErrorMessage = "El nombre del rango es requerido")]
    [MaxLength(50)]
    public string Rango { get; set; } = string.Empty;

    public string? Descripcion { get; set; }
}

public class UpdateRangoDto
{
    [MaxLength(50)]
    public string? Rango { get; set; }

    public string? Descripcion { get; set; }
}
