using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs.Configuracion
{
    public class CreateListaItemDto
    {
        [Required]
        [MaxLength(100)]
        public string Categoria { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Opcion { get; set; } = string.Empty;

        public string Modulo { get; set; } = string.Empty;
    }
}