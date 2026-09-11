using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs.Configuracion
{
    public class ListaMaestraDto
    {
        public int ListaId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Categoria { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Opcion { get; set; } = string.Empty;

        public bool Activo { get; set; }
    }
}