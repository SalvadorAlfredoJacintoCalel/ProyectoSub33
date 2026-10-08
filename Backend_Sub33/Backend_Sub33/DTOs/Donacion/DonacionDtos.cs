using System;
using System.Collections.Generic;

namespace Backend_Sub33.DTOs.Donacion;

public class MaterialDonacionCreateDto
{
    public string Descripcion { get; set; } = string.Empty;
    public int Cantidad { get; set; } = 1;
    public decimal ValorEstimado { get; set; }
    public string? Categoria { get; set; }
}

public class DonacionCreateDto
{
    public DateTime? Fecha { get; set; }
    public string NoRecibo { get; set; } = string.Empty;
    public string Donante { get; set; } = string.Empty;
    public string? DpiNit { get; set; }
    public string? Telefono { get; set; }
    public string Tipo { get; set; } = "Monetaria";
    public string? Categoria { get; set; }
    public string? Descripcion { get; set; }
    public decimal Monto { get; set; }
    public string Estado { get; set; } = "Pendiente";
    public string? MetodoPago { get; set; }
    public string? NoComprobante { get; set; }
    public List<MaterialDonacionCreateDto> Materiales { get; set; } = new();
}

public class DonacionUpdateDto
{
    public DateTime? Fecha { get; set; }
    public string NoRecibo { get; set; } = string.Empty;
    public string Donante { get; set; } = string.Empty;
    public string? DpiNit { get; set; }
    public string? Telefono { get; set; }
    public string Tipo { get; set; } = "Monetaria";
    public string? Categoria { get; set; }
    public string? Descripcion { get; set; }
    public decimal Monto { get; set; }
    public string Estado { get; set; } = "Pendiente";
    public string? MetodoPago { get; set; }
    public string? NoComprobante { get; set; }
    public List<MaterialDonacionCreateDto> Materiales { get; set; } = new();
}

public class MaterialDonacionDto
{
    public int MaterialId { get; set; }
    public int DonacionId { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal ValorEstimado { get; set; }
    public string? Categoria { get; set; }
}

public class DonacionDto
{
    public int DonacionId { get; set; }
    public DateTime Fecha { get; set; }
    public string NoRecibo { get; set; } = string.Empty;
    public string Donante { get; set; } = string.Empty;
    public string? DpiNit { get; set; }
    public string? Telefono { get; set; }
    public string Tipo { get; set; } = "Monetaria";
    public string? Categoria { get; set; }
    public string? Descripcion { get; set; }
    public decimal Monto { get; set; }
    public string Estado { get; set; } = "Pendiente";
    public string? MetodoPago { get; set; }
    public string? NoComprobante { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<MaterialDonacionDto> Materiales { get; set; } = new();
}

public class DonacionFiltrosDto
{
    public string? Busqueda { get; set; }
    public string? Tipo { get; set; }
    public string? Categoria { get; set; }
    public string? Estado { get; set; }
    public int Pagina { get; set; } = 1;
    public int TamanoPagina { get; set; } = 10;
}

public class DonacionListResponseDto
{
    public List<DonacionDto> Items { get; set; } = new();
    public int TotalItems { get; set; }
    public int PaginaActual { get; set; }
    public int TamanoPagina { get; set; }
    public int TotalPaginas { get; set; }
}

public class DonacionCambiarEstadoDto
{
    public string Estado { get; set; } = string.Empty;
}
