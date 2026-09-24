using System.Text.Json.Serialization;

namespace Backend_Sub33.DTOs.Configuracion
{
    public class ListaItemDto
    {
        [JsonPropertyName("lista_id")]
        public int ListaId { get; set; }

        [JsonPropertyName("categoria_id")]
        public int CategoriaId { get; set; }

        [JsonPropertyName("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("codigo")]
        public string Codigo { get; set; } = string.Empty;

        [JsonPropertyName("modulo")]
        public string Modulo { get; set; } = "GENERAL";

        [JsonPropertyName("opcion")]
        public string Opcion { get; set; } = string.Empty;

        [JsonPropertyName("categoria")]
        public string Categoria { get; set; } = string.Empty;
    }
}
