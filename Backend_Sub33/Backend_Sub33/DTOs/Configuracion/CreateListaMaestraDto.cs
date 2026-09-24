using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend_Sub33.DTOs.Configuracion
{
    public class CreateListaMaestraDto
    {
        public int? CategoriaId { get; set; }

        [MaxLength(100)]
        public string? Categoria { get; set; }

        [JsonPropertyName("modulo")]
        public string Modulo { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Opcion { get; set; } = string.Empty;
    }
}