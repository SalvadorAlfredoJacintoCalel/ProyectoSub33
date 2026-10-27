using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Backend_Sub33.Services;

public static class JwtFactory
{
    private static SymmetricSecurityKey CreateKey(IConfiguration configuration)
    {
        var key = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Falta Jwt:Key en la configuración.");
        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
    }

    public static string GenerarAccessToken(
        IConfiguration configuration,
        Guid usuarioId,
        string username,
        IEnumerable<string> roles,
        IEnumerable<string> permisos,
        Guid? personalId)
    {
        var minutes = configuration.GetValue<int?>("Jwt:AccessTokenMinutes") ?? 15;
        return Generar(configuration, usuarioId, username, roles, permisos, personalId, TimeSpan.FromMinutes(minutes), purpose: null);
    }

    public static string GenerarResetToken(IConfiguration configuration, Guid usuarioId, string username)
    {
        return Generar(configuration, usuarioId, username, Array.Empty<string>(), Array.Empty<string>(), personalId: null, TimeSpan.FromMinutes(10), purpose: "reset");
    }

    private static string Generar(
        IConfiguration configuration,
        Guid usuarioId,
        string username,
        IEnumerable<string> roles,
        IEnumerable<string> permisos,
        Guid? personalId,
        TimeSpan vida,
        string? purpose)
    {
        var credentials = new SigningCredentials(CreateKey(configuration), SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuarioId.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, username),
            new("usuario_id", usuarioId.ToString()),
        };

        if (personalId.HasValue)
        {
            claims.Add(new Claim("personal_id", personalId.Value.ToString()));
        }

        if (!string.IsNullOrWhiteSpace(purpose))
        {
            claims.Add(new Claim("purpose", purpose));
        }

        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));
        claims.AddRange(permisos.Select(p => new Claim("permiso", p)));

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.Add(vida),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static ClaimsPrincipal? ValidarResetToken(IConfiguration configuration, string token)
    {
        var issuer = configuration["Jwt:Issuer"];
        var audience = configuration["Jwt:Audience"];

        var parameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = CreateKey(configuration),
            ValidateIssuer = !string.IsNullOrWhiteSpace(issuer),
            ValidIssuer = issuer,
            ValidateAudience = !string.IsNullOrWhiteSpace(audience),
            ValidAudience = audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
        };

        var handler = new JwtSecurityTokenHandler();
        try
        {
            var principal = handler.ValidateToken(token, parameters, out _);
            return principal.HasClaim(c => c.Type == "purpose" && c.Value == "reset") ? principal : null;
        }
        catch
        {
            return null;
        }
    }
}
