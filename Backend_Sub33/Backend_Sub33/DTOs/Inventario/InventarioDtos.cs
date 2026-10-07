using System;
using System.Collections.Generic;

namespace Backend_Sub33.DTOs.Inventario;

public class InventarioItemDto
{
    public int ItemId { get; set; }
    public int CategoriaInvId { get; set; }
    public string CategoriaNombre { get; set; } = string.Empty;
    public int? ProveedorId { get; set; }
    public string? ProveedorNombre { get; set; }
    public string? CodigoBarras { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int StockActual { get; set; }
    public int StockMinimo { get; set; }
    public string UnidadMedida { get; set; } = string.Empty;
    public DateTime? CreatedAt { get; set; }
}

public class InventarioItemCreateDto
{
    public int CategoriaInvId { get; set; }
    public int? ProveedorId { get; set; }
    public string? CodigoBarras { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int StockActual { get; set; }
    public int StockMinimo { get; set; }
    public string? UnidadMedida { get; set; }
}

public class InventarioItemUpdateDto
{
    public int CategoriaInvId { get; set; }
    public int? ProveedorId { get; set; }
    public string? CodigoBarras { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int StockMinimo { get; set; }
    public string? UnidadMedida { get; set; }
}

public class InventarioItemFiltrosDto
{
    public string? Busqueda { get; set; }
    public int? CategoriaInvId { get; set; }
    public int Pagina { get; set; } = 1;
    public int TamanoPagina { get; set; } = 10;
}

public class InventarioMovimientoDto
{
    public int MovimientoId { get; set; }
    public int ItemId { get; set; }
    public string ItemNombre { get; set; } = string.Empty;
    public int TipoMovId { get; set; }
    public string TipoMovNombre { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public Guid? ResponsableId { get; set; }
    public string? ResponsableNombre { get; set; }
    public DateTime? FechaHora { get; set; }
}

public class InventarioMovimientoCreateDto
{
    public int ItemId { get; set; }
    public int TipoMovId { get; set; }
    public int Cantidad { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public Guid? ResponsableId { get; set; }
}

public class EquipoUnidadDto
{
    public int UnidadId { get; set; }
    public string UnidadCodigo { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public string ItemNombre { get; set; } = string.Empty;
    public int CantidadAsignada { get; set; }
}

public class EquipoUnidadCreateDto
{
    public int UnidadId { get; set; }
    public int ItemId { get; set; }
    public int CantidadAsignada { get; set; }
}

public class ServicioInsumoUtilizadoDto
{
    public int ServicioId { get; set; }
    public string ServicioNumero { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public string ItemNombre { get; set; } = string.Empty;
    public int Cantidad { get; set; }
}

public class ServicioInsumoUtilizadoCreateDto
{
    public int ServicioId { get; set; }
    public int ItemId { get; set; }
    public int Cantidad { get; set; }
}
