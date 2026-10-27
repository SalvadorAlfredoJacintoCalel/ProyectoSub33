namespace Backend_Sub33.DTOs.Seguridad;

public class AsignarModuloUsuarioDto
{
    public Guid UsuarioId { get; set; }
    public List<int> ModuloIds { get; set; } = new();
}
