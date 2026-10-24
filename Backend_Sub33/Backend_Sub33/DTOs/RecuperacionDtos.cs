using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs;

public class SolicitarRecuperacionDto
{
    [Required(ErrorMessage = "El nombre de usuario es requerido")]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "El correo electrónico es requerido")]
    [EmailAddress(ErrorMessage = "El correo electrónico no es válido")]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
}

public class VerificarOtpDto
{
    [Required(ErrorMessage = "El nombre de usuario es requerido")]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "El correo electrónico es requerido")]
    [EmailAddress(ErrorMessage = "El correo electrónico no es válido")]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "El código es requerido")]
    [MaxLength(6)]
    public string Codigo { get; set; } = string.Empty;
}

public class RestablecerContrasenaDto
{
    [Required(ErrorMessage = "El token de restablecimiento es requerido")]
    public string ResetToken { get; set; } = string.Empty;

    [Required(ErrorMessage = "La nueva contraseña es requerida")]
    [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres")]
    [MaxLength(100)]
    public string NuevaContrasena { get; set; } = string.Empty;
}

public class CambiarContrasenaDto
{
    [Required(ErrorMessage = "La nueva contraseña es requerida")]
    [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres")]
    [MaxLength(100)]
    public string NuevaContrasena { get; set; } = string.Empty;

    [Required(ErrorMessage = "El código de verificación es requerido")]
    [MaxLength(6)]
    public string Codigo { get; set; } = string.Empty;
}

public class FotoPerfilDto
{
    [Required(ErrorMessage = "La foto es requerida")]
    public string FotoBase64 { get; set; } = string.Empty;
}
