using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_Sub33.Models;

[Table("personal")]
public class Personal
{
    [Key]
    [Column("personal_id")]
    public Guid PersonalId { get; set; }

    [Column("primer_nombre")]
    [Required(ErrorMessage = "El primer nombre es requerido")]
    public string PrimerNombre { get; set; } = string.Empty;

    [Column("segundo_nombre")]
    public string? SegundoNombre { get; set; }

    [Column("primer_apellido")]
    [Required(ErrorMessage = "El primer apellido es requerido")]
    public string PrimerApellido { get; set; } = string.Empty;

    [Column("segundo_apellido")]
    public string? SegundoApellido { get; set; }

    [Column("dpi")]
    [Required(ErrorMessage = "El DPI es requerido")]
    public string Dpi { get; set; } = string.Empty;

    [Column("fecha_nacimiento")]
    public DateTime FechaNacimiento { get; set; }

    [Column("rango")]
    public string Rango { get; set; } = string.Empty;

    [Column("fecha_ingreso")]
    public DateTime FechaIngreso { get; set; }

    [Column("telefono")]
    public string Telefono { get; set; } = string.Empty;

    [Column("estado")]
    public bool Estado { get; set; }

    [Column("contacto_emergencia_nombre")]
    public string? ContactoEmergenciaNombre { get; set; }

    [Column("contacto_emergencia_telefono")]
    public string? ContactoEmergenciaTelefono { get; set; }
}