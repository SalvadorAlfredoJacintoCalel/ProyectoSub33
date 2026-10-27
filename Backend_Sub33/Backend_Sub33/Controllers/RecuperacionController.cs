using System.Data.Common;
using System.Security.Cryptography;
using System.Text;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs;
using Backend_Sub33.Services;
using BCrypt.Net;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Backend_Sub33.Controllers;

[ApiController]
[Route("api/auth")]
public class RecuperacionController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    private readonly ILogger<RecuperacionController> _logger;

    public RecuperacionController(
        AppDbContext context,
        IConfiguration configuration,
        IEmailService emailService,
        ILogger<RecuperacionController> logger)
    {
        _context = context;
        _configuration = configuration;
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost("solicitar-recuperacion")]
    [EnableRateLimiting("RecuperacionPolicy")]
    public async Task<IActionResult> SolicitarRecuperacion([FromBody] SolicitarRecuperacionDto? dto)
    {
        if (dto is null || string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest(new { mensaje = "El nombre de usuario y el correo son requeridos." });
        }

        using var connection = _context.Database.GetDbConnection();
        connection.Open();

        var usuario = await connection.QueryFirstOrDefaultAsync<UsuarioRecuperacionRow>(
            @"SELECT usuario_id, username, email FROM usuarios
              WHERE LOWER(username) = LOWER(@Username)
                AND LOWER(email) = LOWER(@Email)
                AND estado = TRUE
              LIMIT 1;",
            new { dto.Username, dto.Email });

        if (usuario is null || string.IsNullOrWhiteSpace(usuario.Email))
        {
            return BadRequest(new { mensaje = "Información incorrecta, verifique sus datos." });
        }

        var otp = GenerarOtp();
        var otpHash = HashOtp(otp);
        var expiraMinutos = _configuration.GetValue<int?>("Seguridad:OtpMinutos") ?? 3;

        await connection.ExecuteAsync(
            @"INSERT INTO codigos_recuperacion (usuario_id, codigo_otp_hash, email_destino, telefono_destino, expira_en, usado, created_at)
              VALUES (@UsuarioId, @CodigoOtpHash, @EmailDestino, '', @ExpiraEn, FALSE, CURRENT_TIMESTAMP);",
            new
            {
                UsuarioId = usuario.UsuarioId,
                CodigoOtpHash = otpHash,
                EmailDestino = usuario.Email,
                ExpiraEn = DateTime.UtcNow.AddMinutes(expiraMinutos)
            });

        try
        {
            await _emailService.EnviarCodigoOtpAsync(usuario.Email, usuario.Username, otp);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "No se pudo enviar el correo de recuperación a {Email}", usuario.Email);
        }

        return Ok(new { mensaje = "Código enviado correctamente, verifique su correo." });
    }

    [HttpPost("verificar-otp")]
    [EnableRateLimiting("RecuperacionPolicy")]
    public async Task<IActionResult> VerificarOtp([FromBody] VerificarOtpDto? dto)
    {
        if (dto is null || string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Codigo))
        {
            return BadRequest(new { mensaje = "El usuario, el correo y el código son requeridos." });
        }

        using var connection = _context.Database.GetDbConnection();
        connection.Open();

        var usuario = await connection.QueryFirstOrDefaultAsync<UsuarioRecuperacionRow>(
            @"SELECT usuario_id, username, email FROM usuarios
              WHERE LOWER(username) = LOWER(@Username)
                AND LOWER(email) = LOWER(@Email)
                AND estado = TRUE
              LIMIT 1;",
            new { dto.Username, dto.Email });

        if (usuario is null)
        {
            return BadRequest(new { mensaje = "Información incorrecta, verifique sus datos." });
        }

        var otpHash = HashOtp(dto.Codigo.Trim());

        var codigo = await connection.QueryFirstOrDefaultAsync<CodigoRecuperacionRow>(
            @"SELECT codigo_id, codigo_otp_hash FROM codigos_recuperacion
              WHERE usuario_id = @UsuarioId AND usado = FALSE AND expira_en > CURRENT_TIMESTAMP
              ORDER BY created_at DESC
              LIMIT 1;",
            new { UsuarioId = usuario.UsuarioId });

        if (codigo is null || !string.Equals(codigo.CodigoOtpHash, otpHash, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { mensaje = "El código es inválido o ha expirado." });
        }

        await connection.ExecuteAsync(
            "UPDATE codigos_recuperacion SET usado = TRUE WHERE codigo_id = @CodigoId;",
            new { codigo.CodigoId });

        var resetToken = JwtFactory.GenerarResetToken(_configuration, usuario.UsuarioId, usuario.Username);

        return Ok(new { resetToken });
    }

    [HttpPost("restablecer-contrasena")]
    public async Task<IActionResult> RestablecerContrasena([FromBody] RestablecerContrasenaDto? dto)
    {
        if (dto is null || string.IsNullOrWhiteSpace(dto.ResetToken) || string.IsNullOrWhiteSpace(dto.NuevaContrasena))
        {
            return BadRequest(new { mensaje = "El token y la nueva contraseña son requeridos." });
        }

        if (dto.NuevaContrasena.Length < 8)
        {
            return BadRequest(new { mensaje = "La contraseña debe tener al menos 8 caracteres." });
        }

        var principal = JwtFactory.ValidarResetToken(_configuration, dto.ResetToken);
        if (principal is null)
        {
            return BadRequest(new { mensaje = "El enlace de restablecimiento no es válido o ha expirado." });
        }

        var usuarioIdRaw = principal.FindFirst("usuario_id")?.Value;
        if (string.IsNullOrWhiteSpace(usuarioIdRaw) || !Guid.TryParse(usuarioIdRaw, out var usuarioId))
        {
            return BadRequest(new { mensaje = "El enlace de restablecimiento no es válido." });
        }

        var nuevoHash = BCrypt.Net.BCrypt.HashPassword(dto.NuevaContrasena);

        using var connection = _context.Database.GetDbConnection();
        connection.Open();

        await connection.ExecuteAsync(
            "UPDATE usuarios SET password_hash = @Hash, updated_at = CURRENT_TIMESTAMP WHERE usuario_id = @UsuarioId;",
            new { Hash = nuevoHash, UsuarioId = usuarioId });

        // Revocar todas las sesiones activas del usuario.
        await connection.ExecuteAsync("DELETE FROM sesiones_activas WHERE usuario_id = @UsuarioId;", new { UsuarioId = usuarioId });

        return Ok(new { mensaje = "Contraseña actualizada correctamente. Ya puedes iniciar sesión." });
    }

    [Authorize]
    [HttpPost("enviar-codigo-2fa")]
    [EnableRateLimiting("RecuperacionPolicy")]
    public async Task<IActionResult> EnviarCodigo2fa()
    {
        var usuarioIdRaw = User.FindFirst("usuario_id")?.Value;
        if (string.IsNullOrWhiteSpace(usuarioIdRaw) || !Guid.TryParse(usuarioIdRaw, out var usuarioId))
        {
            return Unauthorized(new { mensaje = "Usuario no autenticado." });
        }

        using var connection = _context.Database.GetDbConnection();
        connection.Open();

        var usuario = await connection.QueryFirstOrDefaultAsync<UsuarioRecuperacionRow>(
            "SELECT usuario_id, username, email FROM usuarios WHERE usuario_id = @UsuarioId LIMIT 1;",
            new { UsuarioId = usuarioId });

        if (usuario is null || string.IsNullOrWhiteSpace(usuario.Email))
        {
            return BadRequest(new { mensaje = "No tienes un correo registrado. Solicita al administrador que lo asigne." });
        }

        var otp = GenerarOtp();
        var otpHash = HashOtp(otp);
        var expiraMinutos = _configuration.GetValue<int?>("Seguridad:OtpMinutos") ?? 3;

        await connection.ExecuteAsync(
            @"INSERT INTO codigos_recuperacion (usuario_id, codigo_otp_hash, email_destino, telefono_destino, expira_en, usado, created_at)
              VALUES (@UsuarioId, @CodigoOtpHash, @EmailDestino, '', @ExpiraEn, FALSE, CURRENT_TIMESTAMP);",
            new
            {
                UsuarioId = usuarioId,
                CodigoOtpHash = otpHash,
                EmailDestino = usuario.Email,
                ExpiraEn = DateTime.UtcNow.AddMinutes(expiraMinutos)
            });

        try
        {
            await _emailService.EnviarCodigoOtpAsync(usuario.Email, usuario.Username, otp);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "No se pudo enviar el código 2FA a {Email}", usuario.Email);
        }

        return Ok(new { mensaje = "Código enviado correctamente, verifique su correo." });
    }

    [Authorize]
    [HttpPost("foto")]
    public async Task<IActionResult> SubirFoto([FromBody] FotoPerfilDto? dto)
    {
        if (dto is null || string.IsNullOrWhiteSpace(dto.FotoBase64))
        {
            return BadRequest(new { mensaje = "La foto es requerida." });
        }

        if (dto.FotoBase64.Length > 2_000_000)
        {
            return BadRequest(new { mensaje = "La imagen es demasiado grande." });
        }

        var usuarioIdRaw = User.FindFirst("usuario_id")?.Value;
        if (string.IsNullOrWhiteSpace(usuarioIdRaw) || !Guid.TryParse(usuarioIdRaw, out var usuarioId))
        {
            return Unauthorized(new { mensaje = "Usuario no autenticado." });
        }

        using var connection = _context.Database.GetDbConnection();
        connection.Open();

        await connection.ExecuteAsync(
            "UPDATE usuarios SET foto_base64 = @Foto, updated_at = CURRENT_TIMESTAMP WHERE usuario_id = @UsuarioId;",
            new { Foto = dto.FotoBase64, UsuarioId = usuarioId });

        return Ok(new { mensaje = "Foto actualizada correctamente." });
    }

    [Authorize]
    [HttpPost("cambiar-contrasena")]
    public async Task<IActionResult> CambiarContrasena([FromBody] CambiarContrasenaDto? dto)
    {
        if (dto is null || string.IsNullOrWhiteSpace(dto.NuevaContrasena) || string.IsNullOrWhiteSpace(dto.Codigo))
        {
            return BadRequest(new { mensaje = "La nueva contraseña y el código son requeridos." });
        }

        if (dto.NuevaContrasena.Length < 8)
        {
            return BadRequest(new { mensaje = "La contraseña debe tener al menos 8 caracteres." });
        }

        var usuarioIdRaw = User.FindFirst("usuario_id")?.Value;
        if (string.IsNullOrWhiteSpace(usuarioIdRaw) || !Guid.TryParse(usuarioIdRaw, out var usuarioId))
        {
            return Unauthorized(new { mensaje = "Usuario no autenticado." });
        }

        using var connection = _context.Database.GetDbConnection();
        connection.Open();

        var otpHash = HashOtp(dto.Codigo.Trim());
        var codigo = await connection.QueryFirstOrDefaultAsync<CodigoRecuperacionRow>(
            @"SELECT codigo_id, codigo_otp_hash FROM codigos_recuperacion
              WHERE usuario_id = @UsuarioId AND usado = FALSE AND expira_en > CURRENT_TIMESTAMP
              ORDER BY created_at DESC
              LIMIT 1;",
            new { UsuarioId = usuarioId });

        if (codigo is null || !string.Equals(codigo.CodigoOtpHash, otpHash, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { mensaje = "El código de verificación es inválido o ha expirado." });
        }

        await connection.ExecuteAsync(
            "UPDATE codigos_recuperacion SET usado = TRUE WHERE codigo_id = @CodigoId;",
            new { codigo.CodigoId });

        var nuevoHash = BCrypt.Net.BCrypt.HashPassword(dto.NuevaContrasena);

        await connection.ExecuteAsync(
            "UPDATE usuarios SET password_hash = @Hash, debe_cambiar_contrasena = FALSE, updated_at = CURRENT_TIMESTAMP WHERE usuario_id = @UsuarioId;",
            new { Hash = nuevoHash, UsuarioId = usuarioId });

        await connection.ExecuteAsync("DELETE FROM sesiones_activas WHERE usuario_id = @UsuarioId;", new { UsuarioId = usuarioId });

        return Ok(new { mensaje = "Contraseña cambiada correctamente." });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private string HashOtp(string otp)
    {
        var secret = _configuration["Seguridad:OtpSecret"] ?? "OtpSecretPredeterminadoCambiar";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(otp))).ToLowerInvariant();
    }

    private static string GenerarOtp()
    {
        return RandomNumberGenerator.GetInt32(0, 1000000).ToString("D6");
    }

    private sealed class UsuarioRecuperacionRow
    {
        public Guid UsuarioId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? Email { get; set; }
    }

    private sealed class CodigoRecuperacionRow
    {
        public int CodigoId { get; set; }
        public string CodigoOtpHash { get; set; } = string.Empty;
    }
}
