using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs;

public class PersonalDto
{
    public Guid PersonalId { get; set; }
    public string PrimerNombre { get; set; } = string.Empty;
    public string? SegundoNombre { get; set; }
    public string PrimerApellido { get; set; } = string.Empty;
    public string? SegundoApellido { get; set; }
    public string Dpi { get; set; } = string.Empty;
    public DateTime? FechaNacimiento { get; set; }
    public int? RangoId { get; set; }
    public string? RangoNombre { get; set; }
    public DateTime FechaIngreso { get; set; }
    public string Telefono { get; set; } = string.Empty;
    public bool Estado { get; set; }
    public string? ContactoEmergenciaNombre { get; set; }
    public string? ContactoEmergenciaTelefono { get; set; }
    public UsuarioDto? Usuario { get; set; }
}

public class UsuarioDto
{
    public Guid UsuarioId { get; set; }
    public string Username { get; set; } = string.Empty;
    public bool Estado { get; set; }
    public DateTime? UltimoLogin { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<RolDto> Roles { get; set; } = new();
}

public class RolDto
{
    public int RolId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}

public class PersonalListDto
{
    public string Id { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Dpi { get; set; } = string.Empty;
    public int? RangoId { get; set; }
    public string? Rango { get; set; }
    public string Estado { get; set; } = "Activo";
    public string Telefono { get; set; } = string.Empty;
    public string ContactoEmergencia { get; set; } = string.Empty;
    public string TelEmergencia { get; set; } = string.Empty;
    public string FechaIngreso { get; set; } = string.Empty;
    public string? Usuario { get; set; }
    public int? RolId { get; set; }
    public string? Rol { get; set; }
}

public class CrearPersonalDto
{
    [Required(ErrorMessage = "El primer nombre es requerido")]
    public string PrimerNombre { get; set; } = string.Empty;

    public string? SegundoNombre { get; set; }

    [Required(ErrorMessage = "El primer apellido es requerido")]
    public string PrimerApellido { get; set; } = string.Empty;

    public string? SegundoApellido { get; set; }

    [Required(ErrorMessage = "El DPI es requerido")]
    [RegularExpression(@"^\d{13}$", ErrorMessage = "El DPI debe ser una cadena numérica de 13 dígitos")]
    public string Dpi { get; set; } = string.Empty;

    public DateTime? FechaNacimiento { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "El rango es requerido")]
    public int RangoId { get; set; }

    [Required(ErrorMessage = "El teléfono es requerido")]
    public string Telefono { get; set; } = string.Empty;

    public bool Estado { get; set; } = true;

    [Required(ErrorMessage = "El contacto de emergencia es requerido")]
    public string ContactoEmergenciaNombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono de emergencia es requerido")]
    public string ContactoEmergenciaTelefono { get; set; } = string.Empty;

    public DateTime? FechaIngreso { get; set; }

    public AccesoSistemaDto? AccesoSistema { get; set; }
}

public class AccesoSistemaDto
{
    [Required(ErrorMessage = "El nombre de usuario es requerido")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es requerida")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "El ID del rol es requerido")]
    public int RolId { get; set; }
}

public class ActualizarPersonalDto
{
    public string? PrimerNombre { get; set; }
    public string? SegundoNombre { get; set; }
    public string? PrimerApellido { get; set; }
    public string? SegundoApellido { get; set; }
    public string? Dpi { get; set; }
    public DateTime? FechaNacimiento { get; set; }
    public int? RangoId { get; set; }
    public DateTime? FechaIngreso { get; set; }
    public string? Telefono { get; set; }
    public bool? Estado { get; set; }
    public string? ContactoEmergenciaNombre { get; set; }
    public string? ContactoEmergenciaTelefono { get; set; }
    public AccesoSistemaDto? AccesoSistema { get; set; }
}

public class CambiarEstadoDto
{
    public bool Estado { get; set; }
}

public class RangoDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
}
