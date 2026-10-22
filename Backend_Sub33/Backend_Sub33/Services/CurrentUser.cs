using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Backend_Sub33.Services
{
    public interface ICurrentUser
    {
        Guid UsuarioId { get; }
        Guid? PersonalId { get; }
        bool EsAdmin { get; }
        bool TienePermiso(string codigo);
    }

    public class CurrentUser : ICurrentUser
    {
        private readonly IHttpContextAccessor _accessor;

        public CurrentUser(IHttpContextAccessor accessor)
        {
            _accessor = accessor;
        }

        private ClaimsPrincipal? Principal => _accessor.HttpContext?.User;

        public Guid UsuarioId
        {
            get
            {
                var raw = Principal?.FindFirst("usuario_id")?.Value;
                return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
            }
        }

        public Guid? PersonalId
        {
            get
            {
                var raw = Principal?.FindFirst("personal_id")?.Value;
                return Guid.TryParse(raw, out var id) ? id : (Guid?)null;
            }
        }

        public bool EsAdmin
        {
            get
            {
                var principal = Principal;
                if (principal == null) return false;

                return principal.FindAll(ClaimTypes.Role)
                    .Concat(principal.FindAll("role"))
                    .Any(c => c.Value.Equals("admin", StringComparison.OrdinalIgnoreCase)
                           || c.Value.Equals("administrador", StringComparison.OrdinalIgnoreCase));
            }
        }

        public bool TienePermiso(string codigo)
        {
            if (string.IsNullOrWhiteSpace(codigo)) return false;
            var principal = Principal;
            if (principal == null) return false;

            return principal.FindAll("permiso").Any(c => c.Value == codigo);
        }
    }
}
