using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs.Configuracion
{
    public class UpdateListaMaestraDto
    {
        [Required]
        [MaxLength(150)]
        public string Opcion { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Categoria { get; set; }
    }
}
