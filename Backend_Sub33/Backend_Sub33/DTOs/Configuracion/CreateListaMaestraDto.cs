using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs.Configuracion
{
    public class CreateListaMaestraDto
    {
        public int? CategoriaId { get; set; }

        [MaxLength(100)]
        public string? Categoria { get; set; }

        public string Modulo { get; set; } = "GENERAL";

        [Required]
        [MaxLength(150)]
        public string Opcion { get; set; } = string.Empty;
    }
}