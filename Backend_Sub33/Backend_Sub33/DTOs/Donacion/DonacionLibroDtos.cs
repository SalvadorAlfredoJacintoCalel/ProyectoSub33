using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs.Donacion;

public class DonacionLibroDto
{
    public int LibroId { get; set; }
    public int Anio { get; set; }
    public int Mes { get; set; }
    public decimal SaldoInicial { get; set; }
    public decimal SaldoFinal { get; set; }
    public string? Notas { get; set; }
    public decimal TotalEntradas { get; set; }
    public decimal TotalSalidas { get; set; }
    public List<DonacionMovimientoDto> Movimientos { get; set; } = new();
}

public class DonacionMovimientoDto
{
    public int MovimientoId { get; set; }
    public int LibroId { get; set; }
    public DateTime Fecha { get; set; }
    public string Descripcion { get; set; } = "";
    public bool Firmado { get; set; }
    public int? TipoDocumentoId { get; set; }
    public string? TipoDocumentoNombre { get; set; }
    public string? NoDocumento { get; set; }
    public decimal Entrada { get; set; }
    public decimal Salida { get; set; }
    public decimal Saldo { get; set; }
    public int? DonacionId { get; set; }
    public int? VehiculoId { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class DonacionMovimientoCreateDto
{
    public int Anio { get; set; }
    public int Mes { get; set; }

    [Required]
    public string Descripcion { get; set; } = "";

    public DateTime Fecha { get; set; }
    public bool Firmado { get; set; }
    public int? TipoDocumentoId { get; set; }
    public string? NoDocumento { get; set; }
    public decimal Entrada { get; set; }
    public decimal Salida { get; set; }
}

public class DonacionMovimientoUpdateDto
{
    [Required]
    public string Descripcion { get; set; } = "";

    public DateTime Fecha { get; set; }
    public bool Firmado { get; set; }
    public int? TipoDocumentoId { get; set; }
    public string? NoDocumento { get; set; }
    public decimal Entrada { get; set; }
    public decimal Salida { get; set; }
}
