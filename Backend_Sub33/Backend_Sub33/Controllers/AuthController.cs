using Microsoft.AspNetCore.Mvc;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs;
using Backend_Sub33.Models;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using BCrypt.Net;
using Dapper;
using Microsoft.AspNetCore.RateLimiting;

namespace Backend_Sub33.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("login")]
    [EnableRateLimiting("LoginPolicy")]
    public async Task<IActionResult> Login([FromBody] LoginDto? loginDto)
    {
        if (loginDto is null)
        {
            return BadRequest("El cuerpo de la solicitud es requerido.");
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // 1. Consulta exacta contra la tabla usuarios utilizando username
        //    (sin filtrar estado para poder distinguir entre "incorrectas" y "desactivada")
        var sqlUsuario = @"
            SELECT usuario_id, personal_id, username, password_hash, estado 
            FROM usuarios 
            WHERE LOWER(username) = LOWER(@Username) 
            LIMIT 1;";

        using var connection = _context.Database.GetDbConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            var usuarioDb = await connection.QueryFirstOrDefaultAsync<dynamic>(
                sqlUsuario,
                new { Username = loginDto.Username },
                transaction);

            // El usuario no existe: credenciales incorrectas
            if (usuarioDb == null)
            {
                return Unauthorized(new AuthResponseDto
                {
                    Exito = false,
                    Mensaje = "Las credenciales ingresadas son incorrectas."
                });
            }

            // El usuario existe pero la cuenta está desactivada
            bool activo = (bool)usuarioDb.estado;
            if (!activo)
            {
                return Unauthorized(new AuthResponseDto
                {
                    Exito = false,
                    Mensaje = "La cuenta está desactivada o no cuenta con acceso al sistema."
                });
            }

            // Validación con BCrypt
            bool esValida = BCrypt.Net.BCrypt.Verify(loginDto.Password, (string)usuarioDb.password_hash);
            if (!esValida)
            {
                return Unauthorized(new AuthResponseDto
                {
                    Exito = false,
                    Mensaje = "Las credenciales ingresadas son incorrectas."
                });
            }

            // Actualizar último login
            await connection.ExecuteAsync(
                "UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE usuario_id = @UsuarioId;",
                new { UsuarioId = (Guid)usuarioDb.usuario_id }, transaction);

            transaction.Commit();

            var roles = await connection.QueryAsync<string>(
                @"SELECT r.nombre FROM usuario_roles ur
                  JOIN roles r ON r.rol_id = ur.rol_id
                  WHERE ur.usuario_id = @UsuarioId;",
                new { UsuarioId = (Guid)usuarioDb.usuario_id });

            var permisos = await connection.QueryAsync<string>(
                @"SELECT DISTINCT p.codigo FROM rol_permisos rp
                  JOIN permisos p ON p.permiso_id = rp.permiso_id
                  JOIN usuario_roles ur ON ur.rol_id = rp.rol_id
                  WHERE ur.usuario_id = @UsuarioId;",
                new { UsuarioId = (Guid)usuarioDb.usuario_id });

            // Resolver el nombre real del personal vinculado al usuario (para auditoría / "Formulado por")
            Guid? personalId = usuarioDb.personal_id is Guid pid ? pid : (Guid?)null;

            string nombreCompleto = string.Empty;
            if (personalId.HasValue)
            {
                nombreCompleto = await connection.QueryFirstOrDefaultAsync<string?>(
                    @"SELECT NULLIF(TRIM(CONCAT_WS(' ', primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)), '')
                      FROM personal
                      WHERE personal_id = @PersonalId;",
                    new { PersonalId = personalId.Value }) ?? string.Empty;
            }

            var token = GenerateJwtToken((Guid)usuarioDb.usuario_id, usuarioDb.username, roles, permisos, personalId);

            return Ok(new AuthResponseDto
            {
                Exito = true,
                Mensaje = "Inicio de sesión exitoso",
                UsuarioId = (Guid)usuarioDb.usuario_id,
                Username = usuarioDb.username,
                NombreCompleto = string.IsNullOrWhiteSpace(nombreCompleto) ? (string)usuarioDb.username : nombreCompleto,
                PersonalId = personalId,
                Token = token,
                Roles = roles.ToList(),
                Permisos = permisos.ToList()
            });
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
        finally
        {
            connection.Close();
        }
    }

    private string GenerateJwtToken(Guid usuarioId, string username, IEnumerable<string> roles, IEnumerable<string> permisos, Guid? personalId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

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

        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));
        claims.AddRange(permisos.Select(p => new Claim("permiso", p)));

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}