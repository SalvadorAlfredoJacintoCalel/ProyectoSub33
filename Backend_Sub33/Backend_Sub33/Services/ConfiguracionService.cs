using Backend_Sub33.DTOs.Configuracion;
using Backend_Sub33.Models.Entities;
using Backend_Sub33.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Backend_Sub33.Services
{
    public class ConfiguracionService : IConfiguracionService
    {
        private readonly AppDbContext _context;

        public ConfiguracionService(AppDbContext context)
        {
            _context = context;
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

                return await _context.Database
                    .SqlQueryRaw<ListaItemDto>(sql)
                    .ToListAsync();
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
                var sql = @"
                    SELECT lista_id AS ListaId, 
                           categoria AS Categoria, 
                           opcion AS Opcion 
                    FROM configuracion_listas_maestras 
                    WHERE categoria = @Categoria
                    ORDER BY opcion";

                var parameter = new NpgsqlParameter("@Categoria", categoria);

                return await _context.Database
                    .SqlQueryRaw<ListaItemDto>(sql, parameter)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al obtener listas por categoría: {ex.Message}", ex);
            }
        }

        public async Task CreateListaAsync(CreateListaMaestraDto dto)
        {
            try
            {
                var sql = @"
                    INSERT INTO configuracion_listas_maestras (categoria, opcion) 
                    VALUES (@Categoria, @Opcion) 
                    RETURNING lista_id";

                var parameters = new[]
                {
                    new NpgsqlParameter("@Categoria", dto.Categoria),
                    new NpgsqlParameter("@Opcion", dto.Opcion)
                };

                await _context.Database.ExecuteSqlRawAsync(sql, parameters);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al crear la lista: {ex.Message}", ex);
            }
        }

        public async Task UpdateListaAsync(int id, UpdateListaMaestraDto dto)
        {
            try
            {
                var sql = @"
                    UPDATE configuracion_listas_maestras 
                    SET opcion = @Opcion 
                    WHERE lista_id = @Id";

                var parameters = new[]
                {
                    new NpgsqlParameter("@Id", id),
                    new NpgsqlParameter("@Opcion", dto.Opcion)
                };

                var rowsAffected = await _context.Database.ExecuteSqlRawAsync(sql, parameters);

                if (rowsAffected == 0)
                {
                    throw new KeyNotFoundException("Lista no encontrada");
                }
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

                return await _context.Database
                    .SqlQueryRaw<string>(sql)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al obtener categorías: {ex.Message}", ex);
            }
        }
    }
}