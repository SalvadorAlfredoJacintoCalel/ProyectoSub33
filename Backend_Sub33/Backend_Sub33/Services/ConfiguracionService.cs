using Backend_Sub33.DTOs.Configuracion;
using Backend_Sub33.Models.Entities;
using Backend_Sub33.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Globalization;

namespace Backend_Sub33.Services
{
    public class ConfiguracionService : IConfiguracionService
    {
        private readonly AppDbContext _context;

        public ConfiguracionService(AppDbContext context)
        {
            _context = context;
        }

        private static string NormalizarTexto(string texto)
        {
            if (string.IsNullOrWhiteSpace(texto))
                return string.Empty;

            var trimmed = texto.Trim();
            var textInfo = CultureInfo.CurrentCulture.TextInfo;
            return textInfo.ToTitleCase(trimmed.ToLower());
        }

        private static ListaItemDto NormalizarItem(ListaItemDto item)
        {
            return new ListaItemDto
            {
                ListaId = item.ListaId,
                Categoria = NormalizarTexto(item.Categoria),
                Opcion = NormalizarTexto(item.Opcion)
            };
        }

        public async Task<List<ListaItemDto>> GetAllListasAsync()
        {
            try
            {
                var sql = @"
                    SELECT lista_id AS ListaId, 
                           categoria AS Categoria, 
                           opcion AS Opcion 
                    FROM configuracion_listas_maestras 
                    ORDER BY categoria, opcion";

                var items = await _context.Database
                    .SqlQueryRaw<ListaItemDto>(sql)
                    .ToListAsync();

                return items.Select(NormalizarItem).ToList();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al obtener listas: {ex.Message}", ex);
            }
        }

        public async Task<List<ListaItemDto>> GetPorCategoriaAsync(string categoria)
        {
            try
            {
                var categoriaNormalizada = NormalizarTexto(categoria);

                var sql = @"
                    SELECT lista_id AS ListaId, 
                           categoria AS Categoria, 
                           opcion AS Opcion 
                    FROM configuracion_listas_maestras 
                    WHERE LOWER(categoria) = LOWER(@Categoria)
                    ORDER BY opcion";

                var parameter = new NpgsqlParameter("@Categoria", categoriaNormalizada);

                var items = await _context.Database
                    .SqlQueryRaw<ListaItemDto>(sql, parameter)
                    .ToListAsync();

                return items.Select(NormalizarItem).ToList();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al obtener listas por categoría: {ex.Message}", ex);
            }
        }

        public async Task<bool> CrearListaAsync(string categoria, string opcion)
        {
            var catLimpia = categoria.Trim();
            var opcLimpia = opcion.Trim();

            if (string.IsNullOrWhiteSpace(catLimpia) || string.IsNullOrWhiteSpace(opcLimpia))
            {
                throw new ArgumentException("La categoría y la opción son obligatorias");
            }

            string sql = "INSERT INTO configuracion_listas_maestras (categoria, opcion) VALUES (@categoria, @opcion)";

            var filasAfectadas = await _context.Database.ExecuteSqlRawAsync(
                sql,
                new Npgsql.NpgsqlParameter("@categoria", catLimpia),
                new Npgsql.NpgsqlParameter("@opcion", opcLimpia)
            );

            return filasAfectadas > 0;
        }

        public async Task UpdateListaAsync(int id, UpdateListaMaestraDto dto)
        {
            try
            {
                var opcion = NormalizarTexto(dto.Opcion);

                if (string.IsNullOrWhiteSpace(opcion))
                {
                    throw new ArgumentException("La opción es obligatoria");
                }

                var checkSql = @"
                    SELECT COUNT(*) 
                    FROM configuracion_listas_maestras 
                    WHERE lista_id != @Id 
                      AND LOWER(opcion) = LOWER(@Opcion)";

                var existe = await _context.Database
                    .SqlQueryRaw<int>(checkSql, new NpgsqlParameter("@Id", id), new NpgsqlParameter("@Opcion", opcion))
                    .FirstOrDefaultAsync();

                if (existe > 0)
                {
                    throw new InvalidOperationException($"La opción '{opcion}' ya existe en esta categoría.");
                }

                var sql = @"
                    UPDATE configuracion_listas_maestras 
                    SET opcion = @Opcion 
                    WHERE lista_id = @Id";

                var parameters = new[]
                {
                    new NpgsqlParameter("@Id", id),
                    new NpgsqlParameter("@Opcion", opcion)
                };

                var rowsAffected = await _context.Database.ExecuteSqlRawAsync(sql, parameters);

                if (rowsAffected == 0)
                {
                    throw new KeyNotFoundException("Lista no encontrada");
                }
            }
            catch (Exception ex) when (ex is ArgumentException || ex is InvalidOperationException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al actualizar la lista: {ex.Message}", ex);
            }
        }

        public async Task DeleteListaAsync(int id)
        {
            try
            {
                var sql = "DELETE FROM configuracion_listas_maestras WHERE lista_id = @Id";
                var parameter = new NpgsqlParameter("@Id", id);

                var rowsAffected = await _context.Database.ExecuteSqlRawAsync(sql, parameter);

                if (rowsAffected == 0)
                {
                    throw new KeyNotFoundException("Lista no encontrada");
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al eliminar la lista: {ex.Message}", ex);
            }
        }

        public async Task<List<CatRango>> GetRangosAsync()
        {
            return await _context.CatRangos.ToListAsync();
        }

        public async Task<List<CatHospital>> GetHospitalesAsync()
        {
            return await _context.CatHospitales.ToListAsync();
        }

        public async Task<List<CatTipoEmergencia>> GetTiposEmergenciaAsync()
        {
            return await _context.CatTiposEmergencia.ToListAsync();
        }

        public async Task<List<string>> GetCategoriasAsync()
        {
            try
            {
                var sql = "SELECT DISTINCT categoria FROM configuracion_listas_maestras ORDER BY categoria";

                var categorias = await _context.Database
                    .SqlQueryRaw<string>(sql)
                    .ToListAsync();

                return categorias.Select(NormalizarTexto).Distinct().OrderBy(c => c).ToList();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al obtener categorías: {ex.Message}", ex);
            }
        }
    }
}