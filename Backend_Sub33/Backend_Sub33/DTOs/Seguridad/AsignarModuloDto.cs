namespace Backend_Sub33.DTOs.Seguridad;

public class AsignarModuloDto
{
    public int RolId { get; set; }
    public List<int> ModuloIds { get; set; } = new();
}
