namespace Backend_Sub33.Common;

public class PaginatedResult<T>
{
    public int Pagina { get; init; }
    public int Tamanio { get; init; }
    public int Total { get; init; }
    public int TotalPaginas { get; init; }
    public List<T> Items { get; init; } = new();
}
