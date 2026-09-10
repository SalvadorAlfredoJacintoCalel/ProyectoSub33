namespace Backend_Sub33.DTOs;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public List<string> Permisos { get; set; } = new();
    public List<string> Roles { get; set; } = new();
    public bool Exito { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public Guid UsuarioId { get; set; }
}