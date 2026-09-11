using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs.Configuracion
{
    public class UpdateListaMaestraDto
    {
        [Required]
        [MaxLength(100)]
        public string Opcion { get; set; } = string.Empty;

        public bool Activo { get; set; }
    }
}