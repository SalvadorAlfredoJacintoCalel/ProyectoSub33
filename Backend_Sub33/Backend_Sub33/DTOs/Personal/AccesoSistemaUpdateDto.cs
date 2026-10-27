namespace Backend_Sub33.DTOs.Personal;

public class AccesoSistemaUpdateDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Email { get; set; }
    public int RolId { get; set; }
}