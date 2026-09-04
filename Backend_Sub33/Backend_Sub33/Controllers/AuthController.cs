using Microsoft.AspNetCore.Mvc;
using Backend_Sub33.Data;
using Backend_Sub33.DTOs;
using Backend_Sub33.Models;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.IdentityModel.Tokens;

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

        // 1. Buscar usuario por Username únicamente
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Username.ToLower() == loginDto.Username.ToLower());

        // USUARIO NO ENCONTRADO
        if (usuario == null)
        {
            return Unauthorized(new { mensaje = "Usuario no encontrado" });
        }

        // 2. Comparar contraseña directamente (texto plano)
        if (usuario.PasswordHash != loginDto.Password)
        {
            return Unauthorized(new { mensaje = "Credenciales inválidas" });
        }

        // 3. Simplificado: Comentamos temporalmente la lectura de UsuarioRoles y Permisos
        // var permisos = usuario?.UsuarioRoles
        //     .SelectMany(ur => ur.Rol?.RolPermisos?.Select(rp => rp.Permiso?.Codigo))
        //     .Distinct().ToList() ?? new List<string>();
        //
        // var roles = usuario?.UsuarioRoles
        //     .Select(ur => ur.Rol?.Nombre)
        //     .Distinct().ToList() ?? new List<string>();

        // 4. Generar el token JWT solo con el claim del nombre de usuario
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, usuario.Username)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return Ok(new
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            Username = usuario.Username
        });
    }
}