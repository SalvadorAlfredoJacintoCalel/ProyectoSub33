using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend_Sub33.DTOs.Configuracion
{
    public class ParametroSistemaDto
    {
        [Required]
        public string Clave { get; set; } = string.Empty;

        public string Valor { get; set; } = string.Empty;

        public string? Descripcion { get; set; }
    }

    public class UsuarioConfigDto
    {
        [JsonPropertyName("usuarioId")]
        public Guid UsuarioId { get; set; }

        public string NombreCompleto { get; set; } = string.Empty;

        public string Username { get; set; } = string.Empty;

        public string RolNombre { get; set; } = string.Empty;

        public int RolId { get; set; }

        public bool Estado { get; set; }

        public DateTime CreatedAt { get; set; }
    }

    public class PermisoModuloDto
    {
        [JsonPropertyName("permisoId")]
        public int PermisoId { get; set; }

        public string Codigo { get; set; } = string.Empty;

        public int ModuloId { get; set; }

        public string ModuloNombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public bool Asignado { get; set; }
    }

    public class CambiarEstadoUsuarioDto
    {
        public bool Estado { get; set; }
    }

    public class CambiarRolUsuarioDto
    {
        [Required]
        public int RolId { get; set; }
    }

    public class AsignarPermisosRolDto
    {
        public List<int> Permisos { get; set; } = new();
    }

    public class CrearRangoDto
    {
        public string? Nombre { get; set; }

        public string? Rango { get; set; }
    }

    public class CrearRolDto
    {
        [Required]
        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }
    }

    public class CatalogoItemDto
    {
        public int Id { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }
    }

    public class CatalogoUpsertDto
    {
        public string? Nombre { get; set; }

        public string? Descripcion { get; set; }
    }
}
