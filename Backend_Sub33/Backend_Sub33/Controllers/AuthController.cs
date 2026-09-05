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
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // 1. Consulta exacta contra la tabla usuarios utilizando username
        var sqlUsuario = @"
            SELECT usuario_id, personal_id, username, password_hash, estado 
            FROM usuarios 
            WHERE LOWER(username) = LOWER(@Username) AND estado = true 
            LIMIT 1;";

        using var connection = _context.Database.GetDbConnection();
        connection.Open();
        var transaction = connection.BeginTransaction();

        try
        {
            var usuarioDb = await connection.QueryFirstOrDefaultAsync<dynamic>(
                sqlUsuario,
                new { Username = loginDto.Username },
                transaction);

            // Si no existe o no está activo, bloquear acceso de inmediato
            if (usuarioDb == null)
            {
                return Unauthorized(new AuthResponseDto
                {
                    Exito = false,
                    Mensaje = "Las credenciales ingresadas son incorrectas o la cuenta está desactivada."
                });
            }

            // Validación con BCrypt
            bool esValida = BCrypt.Net.BCrypt.Verify(loginDto.Password, (string)usuarioDb.password_hash);
            if (!esValida)
            {
                return Unauthorized(new AuthResponseDto
                {
                    Exito = false,
                    Mensaje = "Las credenciales ingresadas son incorrectas o la cuenta está desactivada."
                });
            }

            // Actualizar último login
            await connection.ExecuteAsync(
                "UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE usuario_id = @UsuarioId;",
                new { UsuarioId = (Guid)usuarioDb.usuario_id }, transaction);

            transaction.Commit();

            return Ok(new AuthResponseDto
            {
                Exito = true,
                Mensaje = "Inicio de sesión exitoso",
                UsuarioId = (Guid)usuarioDb.usuario_id,
                Username = usuarioDb.username
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
}