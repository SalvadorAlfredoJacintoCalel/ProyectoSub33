using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs;

public class CrearPersonalDto
{
    [Required(ErrorMessage = "El primer nombre es requerido")]
    public string PrimerNombre { get; set; } = string.Empty;

    public string? SegundoNombre { get; set; }

    [Required(ErrorMessage = "El primer apellido es requerido")]
    public string PrimerApellido { get; set; } = string.Empty;

    public string? SegundoApellido { get; set; }

    [Required(ErrorMessage = "El DPI es requerido")]
    public string Dpi { get; set; } = string.Empty;

    [Required(ErrorMessage = "La fecha de nacimiento es requerida")]
    public DateTime FechaNacimiento { get; set; }

    [Required(ErrorMessage = "El rango es requerido")]
    public string Rango { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono es requerido")]
    public string Telefono { get; set; } = string.Empty;

    [Required(ErrorMessage = "El estado es requerido")]
    public bool Estado { get; set; }

    public string? ContactoEmergenciaNombre { get; set; }

    public string? ContactoEmergenciaTelefono { get; set; }

    public DateTime FechaIngreso { get; set; }

    public AccesoSistemaDto? AccesoSistema { get; set; }
}

public class AccesoSistemaDto
{
    [Required(ErrorMessage = "El nombre de usuario es requerido")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es requerida")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "El ID del rol es requerido")]
    public string RolId { get; set; } = string.Empty;
}