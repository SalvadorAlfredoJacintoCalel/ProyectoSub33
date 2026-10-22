namespace Backend_Sub33.DTOs.Seguridad;

public class AsignarPermisoDto
{
    public int RolId { get; set; }
    public List<int> PermisoIds { get; set; } = new();
}
