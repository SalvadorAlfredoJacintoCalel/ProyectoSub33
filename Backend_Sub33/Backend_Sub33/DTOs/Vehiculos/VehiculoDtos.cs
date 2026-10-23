using System.ComponentModel.DataAnnotations;

namespace Backend_Sub33.DTOs.Vehiculos;

// ── Filtros / listado ────────────────────────────────────────────────────────
public class VehiculoFiltrosDto
{
    public string? Busqueda { get; set; }
    public int? TipoId { get; set; }
    public string? EstadoOperativo { get; set; }
    public string? Origen { get; set; }
    public string? Estado { get; set; }
    public int Pagina { get; set; } = 1;
    public int TamanoPagina { get; set; } = 10;
}

public class VehiculoListResponseDto
{
    public List<VehiculoDto> Items { get; set; } = new();
    public int TotalItems { get; set; }
    public int PaginaActual { get; set; }
    public int TamanoPagina { get; set; }
    public int TotalPaginas { get; set; }
}

// ── Vehículo ─────────────────────────────────────────────────────────────────
public class VehiculoDto
{
    public int VehiculoId { get; set; }
    public string? Codigo { get; set; }
    public int? TipoId { get; set; }
    public string? TipoNombre { get; set; }
    public string Marca { get; set; } = "";
    public string Modelo { get; set; } = "";
    public int? Anio { get; set; }
    public string? Color { get; set; }
    public string? Placa { get; set; }
    public string? Chasis { get; set; }
    public string? Motor { get; set; }
    public string? NoUnidad { get; set; }
    public string? Combustible { get; set; }
    public decimal? CapacidadTanque { get; set; }
    public int Kilometraje { get; set; }
    public string? CondicionLlantas { get; set; }
    public string? VolanteDireccion { get; set; }
    public DateTime? SeguroHasta { get; set; }
    public string EstadoOperativo { get; set; } = "Operativa";
    public string Origen { get; set; } = "Compra Propia";
    public int? DonacionId { get; set; }
    public string? Donante { get; set; }
    public string? NoReciboDonacion { get; set; }
    public string Estado { get; set; } = "Activo";
    public decimal ValorUnitario { get; set; }
    public string? Ubicacion { get; set; }
    public int? ItemId { get; set; }
    public DateTime? FechaBaja { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<VehiculoMantenimientoDto> Mantenimientos { get; set; } = new();
    public List<VehiculoCuponDto> Cupones { get; set; } = new();
}

public class VehiculoCreateDto
{
    public string? Codigo { get; set; }
    public int? TipoId { get; set; }

    [Required]
    public string Marca { get; set; } = "";

    [Required]
    public string Modelo { get; set; } = "";

    public int? Anio { get; set; }
    public string? Color { get; set; }
    public string? Placa { get; set; }
    public string? Chasis { get; set; }
    public string? Motor { get; set; }
    public string? NoUnidad { get; set; }
    public string? Combustible { get; set; }
    public decimal? CapacidadTanque { get; set; }
    public int Kilometraje { get; set; }
    public string? CondicionLlantas { get; set; }
    public string? VolanteDireccion { get; set; }
    public DateTime? SeguroHasta { get; set; }
    public string EstadoOperativo { get; set; } = "Operativa";
    public string Origen { get; set; } = "Compra Propia";
    public string? Estado { get; set; }
    public decimal ValorUnitario { get; set; }
    public string? Ubicacion { get; set; }

    // Datos de donación (solo si Origen = "Donado")
    public string? Donante { get; set; }
    public string? DpiNit { get; set; }
    public string? Telefono { get; set; }
    public DateTime? FechaDonacion { get; set; }
    public string? NoReciboDonacion { get; set; }
}

public class VehiculoUpdateDto : VehiculoCreateDto
{
}

public class VehiculoEstadoDto
{
    public string Estado { get; set; } = "Activo";
}

public class VehiculoEstadoOperativoDto
{
    public string EstadoOperativo { get; set; } = "";
}

// ── Mantenimientos ───────────────────────────────────────────────────────────
public class VehiculoMantenimientoDto
{
    public int MantenimientoId { get; set; }
    public int VehiculoId { get; set; }
    public int? TallerId { get; set; }
    public string? TallerNombre { get; set; }
    public string Tipo { get; set; } = "Preventivo";
    public DateTime FechaIngreso { get; set; }
    public DateTime? FechaRetorno { get; set; }
    public int? Kilometraje { get; set; }
    public string? Descripcion { get; set; }
    public decimal Costo { get; set; }
    public string Estado { get; set; } = "En proceso";
    public string? CombustibleEntrada { get; set; }
    public string? CombustibleSalida { get; set; }
    public string? PedalesClutch { get; set; }
    public string? PedalesFrenos { get; set; }
    public string? PedalesAcelerador { get; set; }
    public string? AceiteMotor { get; set; }
    public string? EstadoBateria { get; set; }
    public string? NivelRefrigerante { get; set; }
    public string? SistemaDireccion { get; set; }
    public string? TorretaLuces { get; set; }
    public string? SirenaBocina { get; set; }
    public string? EspejoIzquierdo { get; set; }
    public string? EspejoDerecho { get; set; }
    public string? CalaveraIzquierda { get; set; }
    public string? CalaveraDerecha { get; set; }
    public string? FaroIzquierdo { get; set; }
    public string? FaroDerecho { get; set; }
    public string? Recomendaciones { get; set; }
    public string? PilotoPermanente { get; set; }
    public string? PilotoVoluntario { get; set; }
    public string? Escuadra { get; set; }
    public string? HorarioTurno { get; set; }
    public string? JefeServicio { get; set; }
    public string? FirmaPiloto { get; set; }
    public string? FirmaJefeServicio { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class VehiculoMantenimientoCreateDto
{
    public int? TallerId { get; set; }
    public string Tipo { get; set; } = "Preventivo";
    public DateTime FechaIngreso { get; set; }
    public DateTime? FechaRetorno { get; set; }
    public int? Kilometraje { get; set; }
    public string? Descripcion { get; set; }
    public decimal Costo { get; set; }
    public string Estado { get; set; } = "En proceso";
    public string? CombustibleEntrada { get; set; }
    public string? CombustibleSalida { get; set; }
    public string? PedalesClutch { get; set; }
    public string? PedalesFrenos { get; set; }
    public string? PedalesAcelerador { get; set; }
    public string? AceiteMotor { get; set; }
    public string? EstadoBateria { get; set; }
    public string? NivelRefrigerante { get; set; }
    public string? SistemaDireccion { get; set; }
    public string? TorretaLuces { get; set; }
    public string? SirenaBocina { get; set; }
    public string? EspejoIzquierdo { get; set; }
    public string? EspejoDerecho { get; set; }
    public string? CalaveraIzquierda { get; set; }
    public string? CalaveraDerecha { get; set; }
    public string? FaroIzquierdo { get; set; }
    public string? FaroDerecho { get; set; }
    public string? Recomendaciones { get; set; }
    public string? PilotoPermanente { get; set; }
    public string? PilotoVoluntario { get; set; }
    public string? Escuadra { get; set; }
    public string? HorarioTurno { get; set; }
    public string? JefeServicio { get; set; }
    public string? FirmaPiloto { get; set; }
    public string? FirmaJefeServicio { get; set; }
}

// ── Cupones de combustible ───────────────────────────────────────────────────
public class CuponPeriodoDto
{
    public int PeriodoId { get; set; }
    public int Anio { get; set; }
    public int Mes { get; set; }
    public long? CuponInicialDel { get; set; }
    public long? CuponInicialAl { get; set; }
    public int TotalRecibidos { get; set; }
    public int? ComisionRealizada { get; set; }
    public decimal ValorCuponDefault { get; set; }
    public decimal HaberInicial { get; set; }
    public decimal SaldoInicial { get; set; }
    public decimal SaldoFinal { get; set; }
    public string? Notas { get; set; }
    public int TotalRegistros { get; set; }
    public int TotalCuponesGastados { get; set; }
    public decimal TotalHaber { get; set; }
    public List<VehiculoCuponDto> Cupones { get; set; } = new();

    // Firmas del reporte oficial (pie del formato)
    public string? ElaboradoPor { get; set; }
    public string? JefeAbastecimientos { get; set; }
    public string? Jefe33Cia { get; set; }
    public string? Director { get; set; }
}

public class CuponPeriodoCreateDto
{
    public int Anio { get; set; }
    public int Mes { get; set; }
    public long? CuponInicialDel { get; set; }
    public long? CuponInicialAl { get; set; }
    public int TotalRecibidos { get; set; }
    public int? ComisionRealizada { get; set; }
    public decimal ValorCuponDefault { get; set; } = 100;
    public string? Notas { get; set; }

    // Firmas del reporte oficial (pie del formato)
    public string? ElaboradoPor { get; set; }
    public string? JefeAbastecimientos { get; set; }
    public string? Jefe33Cia { get; set; }
    public string? Director { get; set; }
}

public class VehiculoCuponDto
{
    public int RegistroId { get; set; }
    public int PeriodoId { get; set; }
    public int Anio { get; set; }
    public int Mes { get; set; }
    public int? VehiculoId { get; set; }
    public string? VehiculoCodigo { get; set; }
    public string? Placas { get; set; }
    public string? TipoUnidad { get; set; }
    public DateTime Fecha { get; set; }
    public string Responsable { get; set; } = "";
    public int? Kilometraje { get; set; }
    public decimal? Galonaje { get; set; }
    public int? ComisionNo { get; set; }
    public int? GasolineraId { get; set; }
    public string? GasolineraNombre { get; set; }
    public long CuponDel { get; set; }
    public long CuponAl { get; set; }
    public int TotalCupones { get; set; }
    public decimal ValorCupon { get; set; }
    public decimal Haber { get; set; }
    public bool Firmado { get; set; }
    public string? FirmaBase64 { get; set; }
    public decimal Saldo { get; set; }
    public string? Observaciones { get; set; }
}

public class CuponCreateDto
{
    public int Anio { get; set; }
    public int Mes { get; set; }
    public int? VehiculoId { get; set; }

    [Required]
    public string Responsable { get; set; } = "";

    public DateTime Fecha { get; set; }
    public int? Kilometraje { get; set; }
    public decimal? Galonaje { get; set; }
    public int? GasolineraId { get; set; }
    public long CuponDel { get; set; }
    public long CuponAl { get; set; }
    public decimal ValorCupon { get; set; } = 100;
    public bool Firmado { get; set; }
    public string? FirmaBase64 { get; set; }
    public string? Observaciones { get; set; }
}

public class CuponUpdateDto
{
    public int? VehiculoId { get; set; }

    [Required]
    public string Responsable { get; set; } = "";

    public DateTime Fecha { get; set; }
    public int? Kilometraje { get; set; }
    public decimal? Galonaje { get; set; }
    public int? GasolineraId { get; set; }
    public long CuponDel { get; set; }
    public long CuponAl { get; set; }
    public decimal ValorCupon { get; set; } = 100;
    public bool Firmado { get; set; }
    public string? FirmaBase64 { get; set; }
    public string? Observaciones { get; set; }
}

// ── Reporte oficial de cupones (formato "Libro Mensual de Cupones") ─────────
public class ReporteCuponesDto
{
    public ReporteEncabezadoDto Encabezado { get; set; } = new();
    public List<VehiculoCuponDto> Detalle { get; set; } = new();
    public ReporteTotalesDto Totales { get; set; } = new();
    public ReporteFirmasDto Firmas { get; set; } = new();
}

public class ReporteEncabezadoDto
{
    public int Anio { get; set; }
    public int Mes { get; set; }
    public string MesNombre { get; set; } = "";
    public long? CuponInicialDel { get; set; }
    public long? CuponInicialAl { get; set; }
    public int TotalRecibidos { get; set; }
    public int? ComisionRealizada { get; set; }
    public decimal ValorCuponDefault { get; set; }
    public decimal HaberInicial { get; set; }
}

public class ReporteTotalesDto
{
    public int TotalGastados { get; set; }
    public decimal ValorCupon { get; set; }
    public decimal TotalHaber { get; set; }
    public decimal SaldoFinal { get; set; }
    public int CuponesRestantes { get; set; }
    public decimal SaldoParaSiguienteMes { get; set; }
}

public class FirmaReporteDto
{
    public string Nombre { get; set; } = "";
    public string? FirmaBase64 { get; set; }
}

public class ReporteFirmasDto
{
    public FirmaReporteDto ElaboradoPor { get; set; } = new();
    public FirmaReporteDto JefeAbastecimientos { get; set; } = new();
    public FirmaReporteDto Jefe33Cia { get; set; } = new();
    public FirmaReporteDto Director { get; set; } = new();
}