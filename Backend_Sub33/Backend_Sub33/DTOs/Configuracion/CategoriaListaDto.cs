namespace Backend_Sub33.DTOs.Configuracion
{
    public class CategoriaListaDto
    {
        public int CategoriaId { get; set; }
        public string Codigo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
    }
}