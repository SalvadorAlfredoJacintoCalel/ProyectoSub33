using System;
using System.Collections.Generic;

namespace Backend_Sub33.DTOs.Seguridad;

public class AsignarPermisoUsuarioDto
{
    public Guid UsuarioId { get; set; }
    public List<int> PermisoIds { get; set; } = new();
}
