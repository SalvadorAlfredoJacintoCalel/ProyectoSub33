using System.Security.Claims;
using Backend_Sub33.Data;
using Backend_Sub33.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;

namespace Backend_Sub33.Attributes;

/// <summary>
/// Registra en <see cref="BitacoraAccion"/> cada petición mutante (POST/PUT/PATCH/DELETE)
/// autenticada y exitosa, para auditoría de acciones por usuario.
/// No registra cuerpos de petición (evita exponer contraseñas/tokens).
/// </summary>
public class ActionLogFilter : IAsyncActionFilter
{
    private static readonly HashSet<string> MetodosMutantes = new(StringComparer.OrdinalIgnoreCase)
    {
        "POST", "PUT", "PATCH", "DELETE"
    };

    private readonly AppDbContext _context;
    private readonly ILogger<ActionLogFilter> _logger;

    public ActionLogFilter(AppDbContext context, ILogger<ActionLogFilter> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();

        if (executed.Exception != null)
        {
            return;
        }

        // No registrar accesos denegados (401/403) ni no autenticados.
        if (executed.Result is ForbidResult or ChallengeResult or UnauthorizedResult)
        {
            return;
        }

        var http = context.HttpContext;
        var method = http.Request.Method;
        if (!MetodosMutantes.Contains(method))
        {
            return;
        }

        var path = http.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/api/auth", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var usuarioRaw = http.User?.FindFirst("usuario_id")?.Value;
        if (!Guid.TryParse(usuarioRaw, out var usuarioId))
        {
            return;
        }

        var username = http.User?.FindFirst(ClaimTypes.Name)?.Value
            ?? http.User?.FindFirst("unique_name")?.Value;

        var segmentos = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        var modulo = segmentos.Length > 1 ? segmentos[1].ToLowerInvariant() : "general";

        var accion = method.ToUpperInvariant() switch
        {
            "POST" => "Ingresó",
            "PUT" => "Actualizó",
            "PATCH" => "Modificó",
            "DELETE" => "Eliminó",
            _ => method.ToUpperInvariant()
        };

        try
        {
            _context.BitacoraAcciones.Add(new BitacoraAccion
            {
                UsuarioId = usuarioId,
                UsuarioNombre = username,
                Metodo = method.ToUpperInvariant(),
                Ruta = path,
                Modulo = modulo,
                Accion = accion,
                FechaHora = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "No se pudo registrar la acción {Metodo} {Ruta}", method, path);
        }
    }
}
