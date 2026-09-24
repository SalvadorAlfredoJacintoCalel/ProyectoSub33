using System.Text.Json.Serialization;

namespace Backend_Sub33.DTOs.Configuracion
{
    public class CategoriaListaDto
    {
        [JsonPropertyName("categoria_id")]
        public int CategoriaId { get; set; }

        [JsonPropertyName("codigo")]
        public string Codigo { get; set; } = string.Empty;

        [JsonPropertyName("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("descripcion")]
        public string? Descripcion { get; set; }

        [JsonPropertyName("opciones")]
        public List<ListaMaestraDto> Opciones { get; set; } = new();
    }
}
