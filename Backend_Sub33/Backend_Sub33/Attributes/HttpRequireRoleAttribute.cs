using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Backend_Sub33.Attributes;

/// <summary>
/// Restringe la acción a un rol específico (p. ej. "Administrador").
/// Se usa para acciones delicadas que solo el admin puede ejecutar
/// (reactivar, eliminación física, eliminación en módulos sensibles).
/// </summary>
public class HttpRequireRoleAttribute : AuthorizeAttribute, IAuthorizationFilter
{
    private readonly string _rol;

    public HttpRequireRoleAttribute(string rol)
    {
        _rol = rol;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var usuario = context.HttpContext?.User;

        if (usuario?.Identity?.IsAuthenticated != true)
        {
            context.Result = new ChallengeResult();
            return;
        }

        bool tieneRol = usuario.Claims.Any(c => c.Type == ClaimTypes.Role && c.Value == _rol);

        if (!tieneRol)
        {
            context.Result = new ForbidResult();
        }
    }
}
