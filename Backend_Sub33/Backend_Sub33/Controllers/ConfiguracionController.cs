using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Dapper;
using Npgsql;
using System.Data;
using Backend_Sub33.Data;
using Backend_Sub33.Models;
using Backend_Sub33.Models.Entities;
using Backend_Sub33.DTOs.Configuracion;

namespace Backend_Sub33.Controllers
{
    [ApiController]
    [Route("api/configuracion")]
    public class ConfiguracionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ConfiguracionController> _logger;

        // ── Definición genérica de catálogos (whitelist de tablas seguras) ───────
        private sealed record CatalogoDef(string Tabla, string Pk, string NombreCol, bool TieneDescripcion);

        private static readonly Dictionary<string, CatalogoDef> Catalogos = new(StringComparer.OrdinalIgnoreCase)
        {
            ["rangos"] = new("cat_rangos", "rango_id", "rango", true),
            ["tipos-emergencia"] = new("cat_tipos_emergencia", "tipo_emergencia_id", "tipo", true),
            ["hospitales"] = new("cat_hospitales", "hospital_id", "nombre", false),
            ["tipos-unidad"] = new("cat_tipos_unidad", "tipo_unidad_id", "nombre", true),
            ["roles-servicio"] = new("cat_roles_servicio", "rol_servicio_id", "nombre", true),
            ["tipos-mantenimiento"] = new("cat_tipos_mantenimiento", "tipo_mantenimiento_id", "nombre", true),
        };

        public ConfiguracionController(AppDbContext context, ILogger<ConfiguracionController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private System.Data.Common.DbConnection AbrirConexion()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != ConnectionState.Open)
            {
                connection.Open();
            }
            return connection;
        }

        private static string NormalizarTexto(string? texto)
        {
            if (string.IsNullOrWhiteSpace(texto))
            {
                return string.Empty;
            }

            var palabras = texto.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var resultado = palabras.Select(p =>
                p.Length == 0 ? p : char.ToUpperInvariant(p[0]) + p[1..].ToLowerInvariant());

            return string.Join(' ', resultado);
        }

        private static string? NormalizarDescripcion(string? texto)
        {
            if (string.IsNullOrWhiteSpace(texto))
            {
                return null;
            }
            return texto.Trim();
        }

        // ── Parámetros de la estación ───────────────────────────────────────────
        [HttpGet("parametros")]
        public async Task<IActionResult> GetParametros()
        {
            try
            {
                var parametros = await _context.ParametrosSistema
                    .AsNoTracking()
                    .OrderBy(p => p.Clave)
                    .Select(p => new ParametroSistemaDto
                    {
                        Clave = p.Clave,
                        Valor = p.Valor,
                        Descripcion = p.Descripcion
                    })
                    .ToListAsync();

                return Ok(parametros);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener parámetros");
                return StatusCode(500, new { mensaje = "Error al obtener los parámetros", detalle = ex.Message });
            }
        }

        [HttpPost("parametros")]
        public async Task<IActionResult> GuardarParametros([FromBody] List<ParametroSistemaDto> parametros)
        {
            if (parametros == null)
            {
                return BadRequest(new { mensaje = "Se esperaba una lista de parámetros." });
            }

            try
            {
                foreach (var p in parametros)
                {
                    if (string.IsNullOrWhiteSpace(p.Clave))
                    {
                        continue;
                    }

                    var clave = p.Clave.Trim().ToUpperInvariant();
                    var existente = await _context.ParametrosSistema
                        .FirstOrDefaultAsync(x => x.Clave == clave);

                    if (existente == null)
                    {
                        _context.ParametrosSistema.Add(new ParametroSistema
                        {
                            Clave = clave,
                            Valor = p.Valor ?? string.Empty,
                            Descripcion = p.Descripcion,
                            UpdatedAt = DateTime.UtcNow
                        });
                    }
                    else
                    {
                        existente.Valor = p.Valor ?? string.Empty;
                        existente.Descripcion = p.Descripcion;
                        existente.UpdatedAt = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Parámetros guardados correctamente." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar parámetros");
                return StatusCode(500, new { mensaje = "Error al guardar los parámetros", detalle = ex.Message });
            }
        }

        [HttpPut("parametros/{clave}")]
        public async Task<IActionResult> ActualizarParametro(string clave, [FromBody] ParametroSistemaDto dto)
        {
            if (string.IsNullOrWhiteSpace(clave))
            {
                return BadRequest(new { mensaje = "La clave es obligatoria" });
            }

            try
            {
                var claveNormalizada = clave.Trim().ToUpperInvariant();
                var existente = await _context.ParametrosSistema
                    .FirstOrDefaultAsync(x => x.Clave == claveNormalizada);

                if (existente == null)
                {
                    _context.ParametrosSistema.Add(new ParametroSistema
                    {
                        Clave = claveNormalizada,
                        Valor = dto?.Valor ?? string.Empty,
                        Descripcion = dto?.Descripcion,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
                else
                {
                    existente.Valor = dto?.Valor ?? string.Empty;
                    existente.Descripcion = dto?.Descripcion;
                    existente.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Parámetro guardado correctamente." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar el parámetro {Clave}", clave);
                return StatusCode(500, new { mensaje = "Error al actualizar el parámetro", detalle = ex.Message });
            }
        }

        // ── Usuarios y roles ────────────────────────────────────────────────────
        [HttpGet("usuarios")]
        public async Task<IActionResult> GetUsuarios()
        {
            try
            {
                var usuarios = await _context.Usuarios
                    .AsNoTracking()
                    .OrderBy(u => u.Username)
                    .Select(u => new UsuarioConfigDto
                    {
                        UsuarioId = u.UsuarioId,
                        NombreCompleto = u.Personal != null
                            ? $"{u.Personal.PrimerNombre} {u.Personal.SegundoNombre} {u.Personal.PrimerApellido} {u.Personal.SegundoApellido}".Trim()
                            : u.Username,
                        Username = u.Username,
                        RolNombre = u.UsuarioRoles.Select(ur => ur.Rol.Nombre).FirstOrDefault() ?? "Sin Rol",
                        RolId = u.UsuarioRoles.Select(ur => ur.Rol.RolId).FirstOrDefault(),
                        Estado = u.Estado,
                        CreatedAt = u.CreatedAt
                    })
                    .ToListAsync();

                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener usuarios");
                return StatusCode(500, new { mensaje = "Error al obtener los usuarios", detalle = ex.Message });
            }
        }

        [HttpPut("usuarios/{id:guid}/estado")]
        public async Task<IActionResult> CambiarEstadoUsuario(Guid id, [FromBody] CambiarEstadoUsuarioDto dto)
        {
            try
            {
                var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.UsuarioId == id);
                if (usuario == null)
                {
                    return NotFound(new { mensaje = "Usuario no encontrado" });
                }

                usuario.Estado = dto.Estado;
                usuario.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Estado actualizado correctamente", estado = usuario.Estado });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar el estado del usuario: {Id}", id);
                return StatusCode(500, new { mensaje = "Error al actualizar el estado", detalle = ex.Message });
            }
        }

        [HttpPut("usuarios/{id:guid}/rol")]
        public async Task<IActionResult> CambiarRolUsuario(Guid id, [FromBody] CambiarRolUsuarioDto dto)
        {
            try
            {
                var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.UsuarioId == id);
                if (usuario == null)
                {
                    return NotFound(new { mensaje = "Usuario no encontrado" });
                }

                if (dto.RolId <= 0)
                {
                    return BadRequest(new { mensaje = "El rol es obligatorio" });
                }

                var rolExiste = await _context.Roles.AnyAsync(r => r.RolId == dto.RolId);
                if (!rolExiste)
                {
                    return BadRequest(new { mensaje = "El rol seleccionado no existe" });
                }

                var rolesActuales = await _context.UsuarioRoles.Where(ur => ur.UsuarioId == id).ToListAsync();
                _context.UsuarioRoles.RemoveRange(rolesActuales);
                _context.UsuarioRoles.Add(new UsuarioRol { UsuarioId = id, RolId = dto.RolId });

                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Rol asignado correctamente", rolId = dto.RolId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cambiar el rol del usuario: {Id}", id);
                return StatusCode(500, new { mensaje = "Error al cambiar el rol", detalle = ex.Message });
            }
        }

        // ── Roles ────────────────────────────────────────────────────────────────
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            try
            {
                var roles = await _context.Roles
                    .AsNoTracking()
                    .OrderBy(r => r.Nombre)
                    .Select(r => new { id = r.RolId, nombre = r.Nombre })
                    .ToListAsync();

                return Ok(roles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener roles");
                return StatusCode(500, new { mensaje = "Error al obtener roles", detalle = ex.Message });
            }
        }

        [HttpPost("roles")]
        public async Task<IActionResult> CrearRol([FromBody] CrearRolDto dto)
        {
            try
            {
                var nombre = NormalizarTexto(dto?.Nombre);
                if (string.IsNullOrWhiteSpace(nombre))
                {
                    return BadRequest(new { mensaje = "El nombre del rol es obligatorio" });
                }

                var existe = await _context.Roles.AnyAsync(r => r.Nombre.ToLower() == nombre.ToLower());
                if (existe)
                {
                    return Conflict(new { mensaje = "El rol ya existe" });
                }

                var rol = new Rol
                {
                    Nombre = nombre,
                    Descripcion = NormalizarDescripcion(dto.Descripcion),
                    CreatedAt = DateTime.UtcNow
                };

                _context.Roles.Add(rol);
                await _context.SaveChangesAsync();

                return Ok(new { id = rol.RolId, nombre = rol.Nombre });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear rol");
                return StatusCode(500, new { mensaje = "Error al crear el rol", detalle = ex.Message });
            }
        }

        // ── Matriz de permisos por rol ───────────────────────────────────────────
        [HttpGet("roles/{rolId:int}/permisos")]
        public async Task<IActionResult> GetPermisosRol(int rolId)
        {
            try
            {
                var permisos = await _context.Permisos
                    .AsNoTracking()
                    .OrderBy(p => p.Modulo.NombreModulo)
                    .ThenBy(p => p.Codigo)
                    .Select(p => new PermisoModuloDto
                    {
                        PermisoId = p.PermisoId,
                        Codigo = p.Codigo,
                        ModuloId = p.ModuloId,
                        ModuloNombre = p.Modulo.NombreModulo,
                        Descripcion = p.Descripcion,
                        Asignado = false
                    })
                    .ToListAsync();

                var asignados = await _context.RolPermisos
                    .Where(rp => rp.RolId == rolId)
                    .Select(rp => rp.PermisoId)
                    .ToListAsync();

                var asignadosSet = asignados.ToHashSet();
                foreach (var p in permisos)
                {
                    p.Asignado = asignadosSet.Contains(p.PermisoId);
                }

                return Ok(permisos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener permisos del rol: {RolId}", rolId);
                return StatusCode(500, new { mensaje = "Error al obtener los permisos del rol", detalle = ex.Message });
            }
        }

        [HttpPost("roles/{rolId:int}/permisos")]
        public async Task<IActionResult> GuardarPermisosRol(int rolId, [FromBody] AsignarPermisosRolDto dto)
        {
            try
            {
                var rolExiste = await _context.Roles.AnyAsync(r => r.RolId == rolId);
                if (!rolExiste)
                {
                    return NotFound(new { mensaje = "El rol no existe" });
                }

                var existentes = await _context.RolPermisos.Where(rp => rp.RolId == rolId).ToListAsync();
                _context.RolPermisos.RemoveRange(existentes);

                if (dto?.Permisos != null)
                {
                    foreach (var permisoId in dto.Permisos.Distinct())
                    {
                        _context.RolPermisos.Add(new RolPermiso { RolId = rolId, PermisoId = permisoId });
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Permisos guardados correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar permisos del rol: {RolId}", rolId);
                return StatusCode(500, new { mensaje = "Error al guardar los permisos", detalle = ex.Message });
            }
        }

        // ── Catálogos / Listas Maestras (CRUD genérico) ──────────────────────────
        [HttpGet("catalogos/{tipo}")]
        public async Task<IActionResult> GetCatalogo(string tipo)
        {
            if (!Catalogos.TryGetValue(tipo, out var def))
            {
                return NotFound(new { mensaje = "Catálogo no encontrado" });
            }

            try
            {
                using var connection = AbrirConexion();
                var descCol = def.TieneDescripcion ? "descripcion" : "NULL::text";

                var sql = $@"
                    SELECT {def.Pk} AS id, {def.NombreCol} AS nombre, {descCol} AS descripcion
                    FROM {def.Tabla}
                    ORDER BY {def.NombreCol};";

                var items = await connection.QueryAsync<CatalogoItemDto>(sql);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener catálogo {Tipo}", tipo);
                return StatusCode(500, new { mensaje = "Error al obtener el catálogo", detalle = ex.Message });
            }
        }

        [HttpPost("catalogos/{tipo}")]
        public async Task<IActionResult> CrearCatalogo(string tipo, [FromBody] CatalogoUpsertDto dto)
        {
            if (!Catalogos.TryGetValue(tipo, out var def))
            {
                return NotFound(new { mensaje = "Catálogo no encontrado" });
            }

            var nombre = NormalizarTexto(dto?.Nombre);
            if (string.IsNullOrWhiteSpace(nombre))
            {
                return BadRequest(new { mensaje = "El nombre es obligatorio" });
            }

            try
            {
                using var connection = AbrirConexion();

                var existe = await connection.ExecuteScalarAsync<bool>(
                    $"SELECT EXISTS(SELECT 1 FROM {def.Tabla} WHERE LOWER({def.NombreCol}) = LOWER(@Nombre));",
                    new { Nombre = nombre });

                if (existe)
                {
                    return Conflict(new { mensaje = "La opción ya existe en este catálogo" });
                }

                var descripcion = NormalizarDescripcion(dto?.Descripcion);
                var descCol = def.TieneDescripcion ? ", descripcion" : "";
                var descVal = def.TieneDescripcion ? ", @Descripcion" : "";
                var sql = $"INSERT INTO {def.Tabla} ({def.NombreCol}{descCol}) VALUES (@Nombre{descVal}) RETURNING {def.Pk};";

                var id = await connection.ExecuteScalarAsync<int>(
                    sql,
                    new { Nombre = nombre, Descripcion = descripcion });

                return Ok(new CatalogoItemDto { Id = id, Nombre = nombre, Descripcion = descripcion });
            }
            catch (PostgresException ex) when (ex.SqlState == "23505")
            {
                return Conflict(new { mensaje = "La opción ya existe en este catálogo" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear en catálogo {Tipo}", tipo);
                return StatusCode(500, new { mensaje = "Error al crear el registro", detalle = ex.Message });
            }
        }

        [HttpPut("catalogos/{tipo}/{id:int}")]
        public async Task<IActionResult> ActualizarCatalogo(string tipo, int id, [FromBody] CatalogoUpsertDto dto)
        {
            if (!Catalogos.TryGetValue(tipo, out var def))
            {
                return NotFound(new { mensaje = "Catálogo no encontrado" });
            }

            var nombre = NormalizarTexto(dto?.Nombre);
            if (string.IsNullOrWhiteSpace(nombre))
            {
                return BadRequest(new { mensaje = "El nombre es obligatorio" });
            }

            try
            {
                using var connection = AbrirConexion();

                var existe = await connection.ExecuteScalarAsync<bool>(
                    $"SELECT EXISTS(SELECT 1 FROM {def.Tabla} WHERE LOWER({def.NombreCol}) = LOWER(@Nombre) AND {def.Pk} <> @Id);",
                    new { Nombre = nombre, Id = id });

                if (existe)
                {
                    return Conflict(new { mensaje = "La opción ya existe en este catálogo" });
                }

                var descripcion = NormalizarDescripcion(dto?.Descripcion);
                var descSet = def.TieneDescripcion ? ", descripcion = @Descripcion" : "";
                var sql = $"UPDATE {def.Tabla} SET {def.NombreCol} = @Nombre{descSet} WHERE {def.Pk} = @Id;";

                var affected = await connection.ExecuteAsync(
                    sql,
                    new { Nombre = nombre, Descripcion = descripcion, Id = id });

                if (affected == 0)
                {
                    return NotFound(new { mensaje = "Registro no encontrado" });
                }

                return Ok(new { id = id, nombre = nombre });
            }
            catch (PostgresException ex) when (ex.SqlState == "23505")
            {
                return Conflict(new { mensaje = "La opción ya existe en este catálogo" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar en catálogo {Tipo}", tipo);
                return StatusCode(500, new { mensaje = "Error al actualizar el registro", detalle = ex.Message });
            }
        }

        [HttpDelete("catalogos/{tipo}/{id:int}")]
        public async Task<IActionResult> EliminarCatalogo(string tipo, int id)
        {
            if (!Catalogos.TryGetValue(tipo, out var def))
            {
                return NotFound(new { mensaje = "Catálogo no encontrado" });
            }

            try
            {
                using var connection = AbrirConexion();

                var sql = $"DELETE FROM {def.Tabla} WHERE {def.Pk} = @Id;";

                var affected = await connection.ExecuteAsync(sql, new { Id = id });

                if (affected == 0)
                {
                    return NotFound(new { mensaje = "Registro no encontrado" });
                }

                return Ok(new { mensaje = "Registro eliminado correctamente" });
            }
            catch (PostgresException ex) when (ex.SqlState == "23503")
            {
                return BadRequest(new { mensaje = "No se puede eliminar el registro porque tiene registros asociados en otros módulos." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar en catálogo {Tipo}", tipo);
                return StatusCode(500, new { mensaje = "Error al eliminar el registro", detalle = ex.Message });
            }
        }

        // ── Catálogos para otros módulos (compatibilidad) ───────────────────────
        [HttpGet("rangos")]
        public async Task<IActionResult> GetRangos()
        {
            try
            {
                var rangos = await _context.CatRangos
                    .AsNoTracking()
                    .Select(r => new { id = r.RangoId, nombre = r.Rango })
                    .OrderBy(r => r.nombre)
                    .ToListAsync();

                return Ok(rangos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener rangos");
                return StatusCode(500, new { mensaje = ex.Message, detalle = ex.InnerException?.Message });
            }
        }

        [HttpPost("rangos")]
        public async Task<IActionResult> CrearRango([FromBody] CrearRangoDto dto)
        {
            try
            {
                var nombre = NormalizarTexto(dto?.Nombre ?? dto?.Rango);

                if (string.IsNullOrWhiteSpace(nombre))
                {
                    return BadRequest(new { mensaje = "El nombre del rango es obligatorio" });
                }

                var existe = await _context.CatRangos.AnyAsync(r => r.Rango.ToLower() == nombre.ToLower());
                if (existe)
                {
                    return Conflict(new { mensaje = "El rango ya existe" });
                }

                var rango = new CatRango
                {
                    Rango = nombre,
                    CreatedAt = DateTime.UtcNow
                };
                _context.CatRangos.Add(rango);
                await _context.SaveChangesAsync();

                return Ok(new { id = rango.RangoId, nombre = rango.Rango });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear rango");
                return StatusCode(500, new { mensaje = "Error al crear el rango", detalle = ex.Message });
            }
        }
    }
}
