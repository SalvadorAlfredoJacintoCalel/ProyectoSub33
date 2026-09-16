using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs.Configuracion
{
    public class CreateListaDto
    {
        [Required(ErrorMessage = "La categoría es obligatoria")]
        [MaxLength(100)]
        public string Categoria { get; set; } = string.Empty;

        [Required(ErrorMessage = "La opción es obligatoria")]
        [MaxLength(100)]
        public string Opcion { get; set; } = string.Empty;
    }
}