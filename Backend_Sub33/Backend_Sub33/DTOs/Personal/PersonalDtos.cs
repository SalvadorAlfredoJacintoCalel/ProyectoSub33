using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs.Personal;

public class CreatePersonalDto
{
    [Required(ErrorMessage = "El primer nombre es requerido")]
    [MaxLength(50)]
    public string PrimerNombre { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? SegundoNombre { get; set; }

    [Required(ErrorMessage = "El primer apellido es requerido")]
    [MaxLength(50)]
    public string PrimerApellido { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? SegundoApellido { get; set; }

    [Required(ErrorMessage = "El DPI es requerido")]
    [RegularExpression(@"^\d{13}$", ErrorMessage = "El DPI debe ser una cadena numérica de 13 dígitos")]
    public string Dpi { get; set; } = string.Empty;

    public DateTime? FechaNacimiento { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "El rango es requerido")]
    public int RangoId { get; set; }

    [MaxLength(30)]
    public string? CodigoBombero { get; set; }

    public DateTime? FechaIngreso { get; set; }

    [Required(ErrorMessage = "El teléfono es requerido")]
    [MaxLength(20)]
    public string Telefono { get; set; } = string.Empty;

    public bool Estado { get; set; } = true;

    [Required(ErrorMessage = "El nombre del contacto de emergencia es requerido")]
    [MaxLength(100)]
    public string ContactoEmergenciaNombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono del contacto de emergencia es requerido")]
    [MaxLength(20)]
    public string ContactoEmergenciaTelefono { get; set; } = string.Empty;

    public AccesoSistemaDto? AccesoSistema { get; set; }
}

public class AccesoSistemaDto
{
    [Required(ErrorMessage = "El nombre de usuario es requerido")]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es requerida")]
    [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres")]
    public string Password { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "El rol del sistema es requerido")]
    public int RolId { get; set; }
}

public class UpdatePersonalDto
{
    [MaxLength(50)]
    public string? PrimerNombre { get; set; }

    [MaxLength(50)]
    public string? SegundoNombre { get; set; }

    [MaxLength(50)]
    public string? PrimerApellido { get; set; }

    [MaxLength(50)]
    public string? SegundoApellido { get; set; }

    public string? Dpi { get; set; }

    public DateTime? FechaNacimiento { get; set; }

    public int? RangoId { get; set; }

    [MaxLength(30)]
    public string? CodigoBombero { get; set; }

    public DateTime? FechaIngreso { get; set; }

    [MaxLength(20)]
    public string? Telefono { get; set; }

    [MaxLength(100)]
    public string? ContactoEmergenciaNombre { get; set; }

    [MaxLength(20)]
    public string? ContactoEmergenciaTelefono { get; set; }
}

public class CambiarEstadoDto
{
    public bool Estado { get; set; }
}

public class UsuarioAccesoDto
{
    public Guid UsuarioId { get; init; }
    public string Username { get; init; } = string.Empty;
    public bool Estado { get; init; }
    public int? RolId { get; init; }
    public string? Rol { get; init; }
}

public class PersonalResumenDto
{
    public string PersonalId { get; init; } = string.Empty;
    public string Codigo { get; init; } = string.Empty;
    public string? CodigoBombero { get; init; }
    public string NombreCompleto { get; init; } = string.Empty;
    public string Dpi { get; init; } = string.Empty;
    public int? RangoId { get; init; }
    public string? RangoNombre { get; init; }
    public bool Estado { get; init; }
    public string Telefono { get; init; } = string.Empty;
    public string? ContactoEmergenciaNombre { get; init; }
    public string? ContactoEmergenciaTelefono { get; init; }
    public string FechaIngreso { get; init; } = string.Empty;
    public bool TieneUsuario { get; init; }
}

public class PersonalResponseDto
{
    public Guid PersonalId { get; init; }
    public string Codigo { get; init; } = string.Empty;
    public string? CodigoBombero { get; init; }
    public string PrimerNombre { get; init; } = string.Empty;
    public string? SegundoNombre { get; init; }
    public string PrimerApellido { get; init; } = string.Empty;
    public string? SegundoApellido { get; init; }
    public string NombreCompleto { get; init; } = string.Empty;
    public string Dpi { get; init; } = string.Empty;
    public DateTime? FechaNacimiento { get; init; }
    public int? RangoId { get; init; }
    public string? RangoNombre { get; init; }
    public DateTime FechaIngreso { get; init; }
    public string Telefono { get; init; } = string.Empty;
    public bool Estado { get; init; }
    public string? ContactoEmergenciaNombre { get; init; }
    public string? ContactoEmergenciaTelefono { get; init; }
    public UsuarioAccesoDto? Usuario { get; init; }
}
