using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend_Sub33.Attributes;

namespace Backend_Sub33.Controllers;

[ApiController]
[Route("api/permissions")]
public class PermissionController : ControllerBase
{
    [HttpRequirePermission("ver-dashboard")]
    [HttpGet("dashboard")]
    public IActionResult Dashboard()
    {
        return Ok(new { mensaje = "Bienvenido al dashboard", usuario = User.Identity?.Name });
    }

    [HttpRequirePermission("ver-ventas")]
    [HttpGet("ventas")]
    public IActionResult Ventas()
    {
        return Ok(new { mensaje = "Panel de ventas", usuario = User.Identity?.Name });
    }

    [HttpRequirePermission("ver-reportes")]
    [HttpGet("reportes")]
    public IActionResult Reportes()
    {
        return Ok(new { mensaje = "Reportes del sistema", usuario = User.Identity?.Name });
    }
}