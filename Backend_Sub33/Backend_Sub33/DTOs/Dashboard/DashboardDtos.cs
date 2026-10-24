using System;
using System.Collections.Generic;

namespace Backend_Sub33.DTOs.Dashboard;

public class ConteoTipoDto
{
    public string Tipo { get; set; } = string.Empty;
    public int Cantidad { get; set; }
}

public class ConteoSemanaDto
{
    public string Dia { get; set; } = string.Empty;
    public int Cantidad { get; set; }
}

public class UltimoServicioDto
{
    public string NumeroIncidente { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public string? Hora { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Paciente { get; set; } = string.Empty;
    public string Ubicacion { get; set; } = string.Empty;
    public string Unidad { get; set; } = string.Empty;
}

public class DashboardResumenDto
{
    public int EmergenciasMes { get; set; }
    public int EmergenciasMesAnterior { get; set; }
    public int PersonalTotal { get; set; }
    public int PersonalActivos { get; set; }
    public int PersonalInactivos { get; set; }
    public int VehiculosTotal { get; set; }
    public int VehiculosOperativos { get; set; }
    public decimal DonacionesMes { get; set; }
    public decimal DonacionesMesAnterior { get; set; }
    public List<ConteoTipoDto> IncidentesPorTipo { get; set; } = new();
    public List<ConteoSemanaDto> Semana { get; set; } = new();
    public List<UltimoServicioDto> UltimosServicios { get; set; } = new();
}
