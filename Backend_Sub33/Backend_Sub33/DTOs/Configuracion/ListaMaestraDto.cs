using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend_Sub33.DTOs.Configuracion
{
    public class ListaMaestraDto
    {
        [JsonPropertyName("lista_id")]
        public int ListaId { get; set; }

        [JsonPropertyName("categoria_id")]
        public int CategoriaId { get; set; }

        [JsonPropertyName("opcion")]
        public string Opcion { get; set; } = string.Empty;

        [JsonPropertyName("modulo")]
        public string Modulo { get; set; } = "GENERAL";
    }
}
