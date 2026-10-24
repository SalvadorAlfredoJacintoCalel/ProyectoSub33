using System;
using System.Collections.Generic;

namespace Backend_Sub33.DTOs.Finanzas;

public class TransaccionDto
{
    public long TransaccionId { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public DateTime Fecha { get; set; }
    public string? Referencia { get; set; }
    public Guid ResponsableId { get; set; }
    public string ResponsableNombre { get; set; } = string.Empty;
    public string? ModuloOrigen { get; set; }
    public string? ReferenciaOrigen { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class TransaccionCreateDto
{
    public string Tipo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public DateTime? Fecha { get; set; }
    public string? Referencia { get; set; }
    public string? ModuloOrigen { get; set; }
    public string? ReferenciaOrigen { get; set; }
}

public class TransaccionUpdateDto
{
    public string Tipo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public DateTime? Fecha { get; set; }
    public string? Referencia { get; set; }
}

public class TransaccionFiltrosDto
{
    public string? Tipo { get; set; }
    public DateTime? FechaDesde { get; set; }
    public DateTime? FechaHasta { get; set; }
    public string? Busqueda { get; set; }
    public int Pagina { get; set; } = 1;
    public int TamanoPagina { get; set; } = 10;
}

public class ResumenFinancieroDto
{
    public decimal TotalIngresos { get; set; }
    public decimal TotalGastos { get; set; }
    public decimal TotalDonaciones { get; set; }
    public decimal Balance { get; set; }
}

public class TransaccionListResponseDto
{
    public List<TransaccionDto> Items { get; set; } = new();
    public int TotalItems { get; set; }
    public int PaginaActual { get; set; }
    public int TamanoPagina { get; set; }
    public int TotalPaginas { get; set; }
}

public class AutoGastoMantenimientoDto
{
    public int MantenimientoId { get; set; }
    public decimal Costo { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public string? ResponsableNombre { get; set; }
}

public class AutoIngresoDonacionDto
{
    public int DonacionId { get; set; }
    public decimal Monto { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public string? ResponsableNombre { get; set; }
}
