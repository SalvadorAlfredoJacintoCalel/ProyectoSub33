using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend_Sub33.Data;
using Backend_Sub33.Models;
using Backend_Sub33.DTOs;
using BCrypt.Net;

namespace Backend_Sub33.Controllers
{
    [ApiController]
    [Route("api/personal")]
    public class PersonalController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PersonalController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Registrar([FromBody] CrearPersonalDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var personal = new Personal
                {
                    PersonalId = Guid.NewGuid(),
                    PrimerNombre = dto.PrimerNombre,
                    SegundoNombre = dto.SegundoNombre,
                    PrimerApellido = dto.PrimerApellido,
                    SegundoApellido = dto.SegundoApellido,
                    Dpi = dto.Dpi,
                    FechaNacimiento = dto.FechaNacimiento,
                    Rango = dto.Rango,
                    FechaIngreso = dto.FechaIngreso,
                    Telefono = dto.Telefono,
                    Estado = dto.Estado,
                    ContactoEmergenciaNombre = dto.ContactoEmergenciaNombre,
                    ContactoEmergenciaTelefono = dto.ContactoEmergenciaTelefono
                };

                _context.Personal.Add(personal);
                await _context.SaveChangesAsync();

                string passwordHash = string.Empty;
                if (dto.AccesoSistema != null)
                {
                    passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.AccesoSistema.Password);
                }

                var usuario = new Usuario
                {
                    UsuarioId = Guid.NewGuid(),
                    PersonalId = personal.PersonalId,
                    Username = dto.AccesoSistema?.Username ?? string.Empty,
                    PasswordHash = passwordHash,
                    Estado = dto.Estado,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Usuarios.Add(usuario);
                await _context.SaveChangesAsync();

                if (dto.AccesoSistema != null)
                {
                    _context.UsuarioRoles.Add(new UsuarioRol
                    {
                        UsuarioId = usuario.UsuarioId,
                        RolId = dto.AccesoSistema.RolId
                    });
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                return Created($"api/personal/{personal.PersonalId}", new
                {
                    Message = "Personal y cuenta de usuario registrados exitosamente",
                    PersonalId = personal.PersonalId
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}