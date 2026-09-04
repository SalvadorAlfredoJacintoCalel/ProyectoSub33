using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Backend_Sub33.Attributes;

public class HttpRequirePermissionAttribute : AuthorizeAttribute, IAuthorizationFilter
{
    private readonly string _permiso;

    public HttpRequirePermissionAttribute(string permiso)
    {
        _permiso = permiso;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        if (context.Filters.Any(f => f is HttpRequirePermissionAttribute))
        {
            return;
        }

        var httpContext = context.HttpContext;
        var usuario = httpContext?.User;

        if (usuario == null)
        {
            context.Result = new ChallengeResult();
            return;
        }

        bool tienePermiso = usuario?.Claims?.Any(c => c.Type == "permiso" && c.Value == _permiso) ?? false;

        if (!tienePermiso)
        {
            context.Result = new ForbidResult();
        }
    }
}