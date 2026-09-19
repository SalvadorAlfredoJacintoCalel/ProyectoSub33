using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs.Configuracion
{
    public class ListaMaestraDto
    {
        public int ListaId { get; set; }
        public int CategoriaId { get; set; }
        public string CategoriaNombre { get; set; } = string.Empty;
        public string CategoriaCodigo { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Opcion { get; set; } = string.Empty;
    }
}