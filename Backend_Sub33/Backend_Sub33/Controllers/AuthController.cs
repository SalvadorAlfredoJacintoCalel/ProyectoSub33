using System.Data.Common;
using System.Security.Cryptography;
using System.Text;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs;
using Backend_Sub33.Services;
using BCrypt.Net;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Backend_Sub33.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const string RefreshCookieName = "refresh_token";
    private static readonly string DummyHash = BCrypt.Net.BCrypt.HashPassword("DummyPasswordForTimingOnly123!");

    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public AuthController(AppDbContext context, IConfiguration configuration, IWebHostEnvironment environment)
    {
        _context = context;
        _configuration = configuration;
        _environment = environment;
    }

    [HttpPost("login")]
    [EnableRateLimiting("LoginPolicy")]
    public async Task<IActionResult> Login([FromBody] LoginDto? loginDto)
    {
        if (loginDto is null)
        {
            return BadRequest(new AuthResponseDto { Exito = false, Mensaje = "El cuerpo de la solicitud es requerido." });
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        using var connection = _context.Database.GetDbConnection();
        connection.Open();

        const string sqlUsuario = @"
            SELECT usuario_id, personal_id, username, password_hash, estado, email, foto_base64, intentos_fallidos, bloqueada, debe_cambiar_contrasena
            FROM usuarios
            WHERE LOWER(username) = LOWER(@Username)
            LIMIT 1;";

        var usuarioDb = await connection.QueryFirstOrDefaultAsync<UsuarioRow>(
            sqlUsuario, new { Username = loginDto.Username });

        if (usuarioDb is null)
        {
            BCrypt.Net.BCrypt.Verify(loginDto.Password, DummyHash);
            await RegistrarIntentoAsync(connection, null, "LOGIN_FALLIDO");
            return Unauthorized(GenericFail());
        }

        if (!usuarioDb.Estado || usuarioDb.Bloqueada)
        {
            await RegistrarIntentoAsync(connection, usuarioDb.UsuarioId, "LOGIN_FALLIDO");
            return Unauthorized(GenericFail());
        }

        var esValida = BCrypt.Net.BCrypt.Verify(loginDto.Password, usuarioDb.PasswordHash);
        if (!esValida)
        {
            var esAdmin = await EsAdminAsync(connection, usuarioDb.UsuarioId);
            var maxIntentos = esAdmin
                ? _configuration.GetValue<int?>("Seguridad:MaxIntentosAdmin") ?? 10
                : _configuration.GetValue<int?>("Seguridad:MaxIntentos") ?? 5;

            var intentos = usuarioDb.IntentosFallidos + 1;

            if (intentos >= maxIntentos)
            {
                await connection.ExecuteAsync(
                    "UPDATE usuarios SET intentos_fallidos = 0, bloqueada = TRUE WHERE usuario_id = @UsuarioId;",
                    new { UsuarioId = usuarioDb.UsuarioId });
                await RegistrarIntentoAsync(connection, usuarioDb.UsuarioId, "LOGIN_BLOQUEADO");
            }
            else
            {
                await connection.ExecuteAsync(
                    "UPDATE usuarios SET intentos_fallidos = @Intentos WHERE usuario_id = @UsuarioId;",
                    new { Intentos = intentos, UsuarioId = usuarioDb.UsuarioId });
                await RegistrarIntentoAsync(connection, usuarioDb.UsuarioId, "LOGIN_FALLIDO");
            }

            return Unauthorized(GenericFail());
        }

        await connection.ExecuteAsync(
            "UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP, intentos_fallidos = 0 WHERE usuario_id = @UsuarioId;",
            new { UsuarioId = usuarioDb.UsuarioId });

        await RegistrarIntentoAsync(connection, usuarioDb.UsuarioId, "LOGIN_EXITOSO");

        var (roles, permisos) = await CargarRolesPermisosAsync(connection, usuarioDb.UsuarioId);
        var personalId = usuarioDb.PersonalId;
        var nombreCompleto = await CargarNombreAsync(connection, personalId);

        var accessToken = JwtFactory.GenerarAccessToken(_configuration, usuarioDb.UsuarioId, usuarioDb.Username, roles, permisos, personalId);

        var refreshToken = GenerarRefreshToken();
        await GuardarSesionAsync(connection, usuarioDb.UsuarioId, refreshToken, loginDto.Recordar);
        SetRefreshCookie(Response, refreshToken, loginDto.Recordar);

        return Ok(new AuthResponseDto
        {
            Exito = true,
            Mensaje = "Inicio de sesión exitoso",
            UsuarioId = usuarioDb.UsuarioId,
            Username = usuarioDb.Username,
            NombreCompleto = string.IsNullOrWhiteSpace(nombreCompleto) ? usuarioDb.Username : nombreCompleto,
            PersonalId = personalId,
            FotoBase64 = usuarioDb.FotoBase64,
            DebeCambiarContrasena = usuarioDb.DebeCambiarContrasena,
            Token = accessToken,
            Roles = roles,
            Permisos = permisos
        });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var cookie = Request.Cookies[RefreshCookieName];
        if (string.IsNullOrWhiteSpace(cookie))
        {
            return Unauthorized(GenericFail());
        }

        using var connection = _context.Database.GetDbConnection();
        connection.Open();

        var sesion = await connection.QueryFirstOrDefaultAsync<SesionRow>(
            @"SELECT sesion_id, usuario_id, token_hash, expira_en
              FROM sesiones_activas
              WHERE token_hash = @TokenHash AND expira_en > CURRENT_TIMESTAMP
              LIMIT 1;",
            new { TokenHash = HashToken(cookie) });

        if (sesion is null)
        {
            ClearRefreshCookie(Response);
            return Unauthorized(GenericFail());
        }

        var usuarioDb = await connection.QueryFirstOrDefaultAsync<UsuarioRow>(
            @"SELECT usuario_id, personal_id, username, password_hash, estado, email, foto_base64, intentos_fallidos, bloqueada, debe_cambiar_contrasena
              FROM usuarios WHERE usuario_id = @UsuarioId LIMIT 1;",
            new { UsuarioId = sesion.UsuarioId });

        if (usuarioDb is null || !usuarioDb.Estado || usuarioDb.Bloqueada)
        {
            await connection.ExecuteAsync("DELETE FROM sesiones_activas WHERE sesion_id = @SesionId;", new { sesion.SesionId });
            ClearRefreshCookie(Response);
            return Unauthorized(GenericFail());
        }

        var nuevoRefresh = GenerarRefreshToken();
        await connection.ExecuteAsync(
            "UPDATE sesiones_activas SET token_hash = @NuevoHash, expira_en = @Expira, created_at = CURRENT_TIMESTAMP WHERE sesion_id = @SesionId;",
            new { NuevoHash = HashToken(nuevoRefresh), Expira = DateTime.UtcNow.AddDays(30), SesionId = sesion.SesionId });
        SetRefreshCookie(Response, nuevoRefresh, recordar: true);

        var (roles, permisos) = await CargarRolesPermisosAsync(connection, usuarioDb.UsuarioId);
        var personalId = usuarioDb.PersonalId;
        var nombreCompleto = await CargarNombreAsync(connection, personalId);
        var accessToken = JwtFactory.GenerarAccessToken(_configuration, usuarioDb.UsuarioId, usuarioDb.Username, roles, permisos, personalId);

        return Ok(new AuthResponseDto
        {
            Exito = true,
            Mensaje = "Sesión renovada",
            UsuarioId = usuarioDb.UsuarioId,
            Username = usuarioDb.Username,
            NombreCompleto = string.IsNullOrWhiteSpace(nombreCompleto) ? usuarioDb.Username : nombreCompleto,
            PersonalId = personalId,
            FotoBase64 = usuarioDb.FotoBase64,
            DebeCambiarContrasena = usuarioDb.DebeCambiarContrasena,
            Token = accessToken,
            Roles = roles,
            Permisos = permisos
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var cookie = Request.Cookies[RefreshCookieName];
        if (!string.IsNullOrWhiteSpace(cookie))
        {
            using var connection = _context.Database.GetDbConnection();
            connection.Open();
            await connection.ExecuteAsync(
                "DELETE FROM sesiones_activas WHERE token_hash = @TokenHash;",
                new { TokenHash = HashToken(cookie) });
        }

        ClearRefreshCookie(Response);
        return Ok(new { mensaje = "Sesión cerrada correctamente." });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static AuthResponseDto GenericFail() =>
        new() { Exito = false, Mensaje = "Credenciales incorrectas, por favor verifique su información." };

    private async Task<bool> EsAdminAsync(DbConnection connection, Guid usuarioId)
    {
        return await connection.ExecuteScalarAsync<bool>(
            @"SELECT EXISTS (
                  SELECT 1 FROM usuario_roles ur
                  JOIN roles r ON r.rol_id = ur.rol_id
                  WHERE ur.usuario_id = @UsuarioId AND LOWER(r.nombre) IN ('admin', 'administrador')
              );",
            new { UsuarioId = usuarioId });
    }

    private async Task RegistrarIntentoAsync(DbConnection connection, Guid? usuarioId, string evento)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
        try
        {
            await connection.ExecuteAsync(
                @"INSERT INTO bitacora_accesos (usuario_id, ip_origen, evento, exitoso, fecha_hora)
                  VALUES (@UsuarioId, @Ip, @Evento, @Exitoso, CURRENT_TIMESTAMP);",
                new { UsuarioId = usuarioId, Ip = ip, Evento = evento, Exitoso = evento == "LOGIN_EXITOSO" });
        }
        catch
        {
            // La bitácora no debe bloquear el flujo de login.
        }
    }

    private async Task<(List<string> Roles, List<string> Permisos)> CargarRolesPermisosAsync(DbConnection connection, Guid usuarioId)
    {
        var roles = (await connection.QueryAsync<string>(
            @"SELECT r.nombre FROM usuario_roles ur
              JOIN roles r ON r.rol_id = ur.rol_id
              WHERE ur.usuario_id = @UsuarioId;",
            new { UsuarioId = usuarioId })).ToList();

        var permisos = (await connection.QueryAsync<string>(
            @"SELECT DISTINCT p.codigo FROM (
                  SELECT rp.permiso_id FROM rol_permisos rp
                  JOIN usuario_roles ur ON ur.rol_id = rp.rol_id
                  WHERE ur.usuario_id = @UsuarioId
                  UNION
                  SELECT up.permiso_id FROM usuario_permisos up
                  WHERE up.usuario_id = @UsuarioId
              ) t
              JOIN permisos p ON p.permiso_id = t.permiso_id;",
            new { UsuarioId = usuarioId })).ToList();

        return (roles, permisos);
    }

    private async Task<string> CargarNombreAsync(DbConnection connection, Guid? personalId)
    {
        if (!personalId.HasValue)
        {
            return string.Empty;
        }

        return await connection.QueryFirstOrDefaultAsync<string?>(
            @"SELECT NULLIF(TRIM(CONCAT_WS(' ', primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)), '')
              FROM personal WHERE personal_id = @PersonalId;",
            new { PersonalId = personalId.Value }) ?? string.Empty;
    }

    private static string GenerarRefreshToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(48))
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    private static string HashToken(string token)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
    }

    private async Task GuardarSesionAsync(DbConnection connection, Guid usuarioId, string refreshToken, bool recordar)
    {
        var expira = recordar ? DateTime.UtcNow.AddDays(30) : DateTime.UtcNow.AddHours(12);
        await connection.ExecuteAsync(
            @"INSERT INTO sesiones_activas (sesion_id, usuario_id, token_hash, expira_en, created_at)
              VALUES (@SesionId, @UsuarioId, @TokenHash, @ExpiraEn, @CreatedAt);",
            new
            {
                SesionId = Guid.NewGuid(),
                UsuarioId = usuarioId,
                TokenHash = HashToken(refreshToken),
                ExpiraEn = expira,
                CreatedAt = DateTime.UtcNow
            });
    }

    private void SetRefreshCookie(HttpResponse response, string refreshToken, bool recordar)
    {
        var esDesarrollo = _environment.IsDevelopment();
        var options = new CookieOptions
        {
            HttpOnly = true,
            Secure = !esDesarrollo,
            SameSite = esDesarrollo ? SameSiteMode.Lax : SameSiteMode.None,
            Path = "/api/auth"
        };

        if (recordar)
        {
            options.Expires = DateTimeOffset.UtcNow.AddDays(30);
        }

        response.Cookies.Append(RefreshCookieName, refreshToken, options);
    }

    private void ClearRefreshCookie(HttpResponse response)
    {
        var esDesarrollo = _environment.IsDevelopment();
        response.Cookies.Delete(RefreshCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = !esDesarrollo,
            SameSite = esDesarrollo ? SameSiteMode.Lax : SameSiteMode.None,
            Path = "/api/auth"
        });
    }

    private sealed class UsuarioRow
    {
        public Guid UsuarioId { get; set; }
        public Guid? PersonalId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public bool Estado { get; set; }
        public string? Email { get; set; }
        public string? FotoBase64 { get; set; }
        public int IntentosFallidos { get; set; }
        public bool Bloqueada { get; set; }
        public bool DebeCambiarContrasena { get; set; }
    }

    private sealed class SesionRow
    {
        public Guid SesionId { get; set; }
        public Guid UsuarioId { get; set; }
        public string TokenHash { get; set; } = string.Empty;
        public DateTime ExpiraEn { get; set; }
    }
}
