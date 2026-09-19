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
                CategoriaId = item.CategoriaId,
                CategoriaNombre = NormalizarTexto(item.CategoriaNombre),
                CategoriaCodigo = item.CategoriaCodigo,
                Opcion = NormalizarTexto(item.Opcion)
            };
        }

        public async Task<List<ListaItemDto>> GetAllListasAsync()
        {
            try
            {
                var sql = @"
                    SELECT 
                        clm.lista_id AS ListaId,
                        clm.categoria_id AS CategoriaId,
                        ccl.nombre AS CategoriaNombre,
                        ccl.codigo AS CategoriaCodigo,
                        clm.opcion AS Opcion
                    FROM configuracion_listas_maestras clm
                    INNER JOIN cat_categorias_listas ccl ON clm.categoria_id = ccl.categoria_id
                    ORDER BY ccl.nombre, clm.opcion";

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

        public async Task<List<ListaItemDto>> GetPorCategoriaAsync(int categoriaId)
        {
            try
            {
                var sql = @"
                    SELECT 
                        clm.lista_id AS ListaId,
                        clm.categoria_id AS CategoriaId,
                        ccl.nombre AS CategoriaNombre,
                        ccl.codigo AS CategoriaCodigo,
                        clm.opcion AS Opcion
                    FROM configuracion_listas_maestras clm
                    INNER JOIN cat_categorias_listas ccl ON clm.categoria_id = ccl.categoria_id
                    WHERE clm.categoria_id = @CategoriaId
                    ORDER BY clm.opcion";

                var parameter = new NpgsqlParameter("@CategoriaId", categoriaId);

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

        public async Task<List<CatCategoriaLista>> GetCategoriasAsync()
        {
            try
            {
                return await _context.CatCategoriasListas
                    .OrderBy(c => c.Nombre)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al obtener categorías: {ex.Message}", ex);
            }
        }

        public async Task<(bool exito, string mensaje, ListaItemDto? item)> CrearListaAsync(CreateListaMaestraDto dto)
        {
            var opc = dto.Opcion?.Trim();

            if (string.IsNullOrWhiteSpace(opc))
            {
                return (false, "La opción es obligatoria.", null);
            }

            int categoriaId;

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                if (dto.CategoriaId.HasValue && dto.CategoriaId.Value > 0)
                {
                    categoriaId = dto.CategoriaId.Value;

                    var categoriaExiste = await _context.CatCategoriasListas
                        .AnyAsync(c => c.CategoriaId == categoriaId);

                    if (!categoriaExiste)
                    {
                        await transaction.RollbackAsync();
                        return (false, $"La categoría con ID {categoriaId} no existe.", null);
                    }
                }
                else if (!string.IsNullOrWhiteSpace(dto.Categoria))
                {
                    var categoriaTexto = dto.Categoria!.Trim();
                    var codigoCategoria = categoriaTexto.ToUpperInvariant();

                    var categoria = await _context.CatCategoriasListas
                        .FirstOrDefaultAsync(c => c.Codigo.ToLower() == codigoCategoria.ToLower() 
                                               || c.Nombre.ToLower() == categoriaTexto.ToLower());

                    if (categoria == null)
                    {
                        categoria = new CatCategoriaLista
                        {
                            Codigo = codigoCategoria,
                            Nombre = categoriaTexto,
                            Descripcion = $"Categoría creada automáticamente: {categoriaTexto}",
                            CreatedAt = DateTime.UtcNow
                        };

                        _context.CatCategoriasListas.Add(categoria);
                        await _context.SaveChangesAsync();
                    }

                    categoriaId = categoria.CategoriaId;
                }
                else
                {
                    await transaction.RollbackAsync();
                    return (false, "La categoría es obligatoria (enviar CategoriaId o Categoria).", null);
                }

                var opcionExistente = await _context.ConfiguracionListasMaestras
                    .FirstOrDefaultAsync(l => l.CategoriaId == categoriaId 
                                           && l.Opcion.ToLower() == opc.ToLower());

                if (opcionExistente != null)
                {
                    var categoriaInfo = await _context.CatCategoriasListas
                        .FirstOrDefaultAsync(c => c.CategoriaId == categoriaId);

                    await transaction.CommitAsync();

                    return (true, "La opción ya existe en esta categoría.", new ListaItemDto
                    {
                        ListaId = opcionExistente.ListaId,
                        CategoriaId = opcionExistente.CategoriaId,
                        CategoriaNombre = categoriaInfo?.Nombre ?? string.Empty,
                        CategoriaCodigo = categoriaInfo?.Codigo ?? string.Empty,
                        Opcion = opcionExistente.Opcion
                    });
                }

                var nuevaLista = new ConfiguracionListaMaestra
                {
                    CategoriaId = categoriaId,
                    Opcion = opc,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ConfiguracionListasMaestras.Add(nuevaLista);
                await _context.SaveChangesAsync();

                var categoriaFinal = await _context.CatCategoriasListas
                    .FirstOrDefaultAsync(c => c.CategoriaId == categoriaId);

                await transaction.CommitAsync();

                return (true, "Registro guardado exitosamente", new ListaItemDto
                {
                    ListaId = nuevaLista.ListaId,
                    CategoriaId = nuevaLista.CategoriaId,
                    CategoriaNombre = categoriaFinal?.Nombre ?? string.Empty,
                    CategoriaCodigo = categoriaFinal?.Codigo ?? string.Empty,
                    Opcion = nuevaLista.Opcion
                });
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "23505")
            {
                await transaction.RollbackAsync();

                if (dto.CategoriaId.HasValue || !string.IsNullOrWhiteSpace(dto.Categoria))
                {
                    var resolvedId = dto.CategoriaId.HasValue 
                        ? dto.CategoriaId.Value 
                        : (await _context.CatCategoriasListas
                            .FirstOrDefaultAsync(c => c.Codigo.ToLower() == dto.Categoria!.ToLower().ToUpperInvariant() 
                                                   || c.Nombre.ToLower() == dto.Categoria!.ToLower()))?.CategoriaId ?? 0;

                    if (resolvedId > 0)
                    {
                        var opcionExistente = await _context.ConfiguracionListasMaestras
                            .FirstOrDefaultAsync(l => l.CategoriaId == resolvedId 
                                                   && l.Opcion.ToLower() == opc.ToLower());

                        if (opcionExistente != null)
                        {
                            var catInfo = await _context.CatCategoriasListas
                                .FirstOrDefaultAsync(c => c.CategoriaId == resolvedId);

                            return (true, "La opción ya existe en esta categoría.", new ListaItemDto
                            {
                                ListaId = opcionExistente.ListaId,
                                CategoriaId = opcionExistente.CategoriaId,
                                CategoriaNombre = catInfo?.Nombre ?? string.Empty,
                                CategoriaCodigo = catInfo?.Codigo ?? string.Empty,
                                Opcion = opcionExistente.Opcion
                            });
                        }
                    }
                }

                return (false, $"Error de duplicado: {ex.Message}", null);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw new Exception($"Error al crear la lista: {ex.Message}", ex);
            }
        }

        public async Task UpdateListaAsync(int id, UpdateListaMaestraDto dto)
        {
            try
            {
                var opcion = dto.Opcion.Trim();

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
    }
}