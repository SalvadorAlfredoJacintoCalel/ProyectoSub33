using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs.Configuracion
{
    public class CreateListaMaestraDto
    {
        [Required]
        [MaxLength(100)]
        public string Categoria { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Opcion { get; set; } = string.Empty;
    }
}