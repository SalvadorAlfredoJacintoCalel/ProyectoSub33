using Backend_Sub33.DTOs.Configuracion;
using Backend_Sub33.Models.Entities;
using Backend_Sub33.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend_Sub33.Services
{
    public class ConfiguracionService : IConfiguracionService
    {
        private readonly AppDbContext _context;

        public ConfiguracionService(AppDbContext context)
        {
            _context = context;
        }

        private static string GenerarCodigo(string nombre)
        {
            return new string(nombre.Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();
        }

        private static ListaItemDto MapListaItem(ConfiguracionListaMaestra lista, CatCategoriaLista? categoria)
        {
            return new ListaItemDto
            {
                ListaId = lista.ListaId,
                CategoriaId = lista.CategoriaId,
                Nombre = categoria?.Nombre ?? string.Empty,
                Codigo = categoria?.Codigo ?? string.Empty,
                Modulo = lista.Modulo,
                Opcion = lista.Opcion,
                Categoria = categoria?.Nombre ?? string.Empty
            };
        }

        public async Task<List<ListaItemDto>> GetAllListasAsync()
        {
            return await _context.ConfiguracionListasMaestras
                .Include(l => l.Categoria)
                .OrderBy(l => l.Categoria!.Nombre)
                .ThenBy(l => l.Opcion)
                .Select(l => new ListaItemDto
                {
                    ListaId = l.ListaId,
                    CategoriaId = l.CategoriaId,
                    Nombre = l.Categoria!.Nombre,
                    Codigo = l.Categoria.Codigo,
                    Modulo = l.Modulo,
                    Opcion = l.Opcion,
                    Categoria = l.Categoria.Nombre
                })
                .ToListAsync();
        }

        public async Task<List<ListaItemDto>> GetPorCategoriaAsync(int categoriaId)
        {
            return await _context.ConfiguracionListasMaestras
                .Include(l => l.Categoria)
                .Where(l => l.CategoriaId == categoriaId)
                .OrderBy(l => l.Opcion)
                .Select(l => new ListaItemDto
                {
                    ListaId = l.ListaId,
                    CategoriaId = l.CategoriaId,
                    Nombre = l.Categoria!.Nombre,
                    Codigo = l.Categoria.Codigo,
                    Modulo = l.Modulo,
                    Opcion = l.Opcion,
                    Categoria = l.Categoria.Nombre
                })
                .ToListAsync();
        }

        public async Task<List<CategoriaListaDto>> GetCategoriasAsync()
        {
            return await _context.CatCategoriasListas
                .AsNoTracking()
                .Include(c => c.Opciones)
                .OrderBy(c => c.Nombre)
                .Select(c => new CategoriaListaDto
                {
                    CategoriaId = c.CategoriaId,
                    Codigo = c.Codigo,
                    Nombre = c.Nombre,
                    Descripcion = c.Descripcion,
                    Opciones = c.Opciones
                        .OrderBy(o => o.Opcion)
                        .Select(o => new ListaMaestraDto
                        {
                            ListaId = o.ListaId,
                            CategoriaId = o.CategoriaId,
                            Opcion = o.Opcion,
                            Modulo = o.Modulo
                        })
                        .ToList()
                })
                .ToListAsync();
        }

        public async Task<(bool exito, string mensaje, ListaItemDto? item)> CrearListaAsync(CreateListaMaestraDto dto)
        {
            var opcion = dto.Opcion?.Trim();

            if (string.IsNullOrWhiteSpace(opcion))
            {
                return (false, "La opción es obligatoria.", null);
            }

            int categoriaId;
            CatCategoriaLista? categoria;

            if (dto.CategoriaId.HasValue && dto.CategoriaId.Value > 0)
            {
                categoriaId = dto.CategoriaId.Value;

                categoria = await _context.CatCategoriasListas
                    .FirstOrDefaultAsync(c => c.CategoriaId == categoriaId);

                if (categoria == null)
                {
                    return (false, $"La categoría con ID {categoriaId} no existe.", null);
                }
            }
            else if (!string.IsNullOrWhiteSpace(dto.Categoria))
            {
                var nombreCategoria = dto.Categoria.Trim();

                categoria = await _context.CatCategoriasListas
                    .FirstOrDefaultAsync(c => c.Nombre.ToLower() == nombreCategoria.ToLower());

                if (categoria == null)
                {
                    var codigoCategoria = GenerarCodigo(nombreCategoria);

                    categoria = await _context.CatCategoriasListas
                        .FirstOrDefaultAsync(c => c.Codigo.ToLower() == codigoCategoria.ToLower());

                    if (categoria == null)
                    {
                        categoria = new CatCategoriaLista
                        {
                            Codigo = codigoCategoria,
                            Nombre = nombreCategoria,
                            Descripcion = $"Categoría creada automáticamente: {nombreCategoria}",
                            CreatedAt = DateTime.UtcNow
                        };

                        _context.CatCategoriasListas.Add(categoria);

                        try
                        {
                            await _context.SaveChangesAsync();
                        }
                        catch (DbUpdateException)
                        {
                            categoria = await _context.CatCategoriasListas
                                .FirstOrDefaultAsync(c => c.Codigo.ToLower() == codigoCategoria.ToLower());

                            if (categoria == null)
                            {
                                throw;
                            }
                        }
                    }
                }

                categoriaId = categoria.CategoriaId;
            }
            else
            {
                return (false, "La categoría es obligatoria (enviar CategoriaId o Categoria).", null);
            }

            var opcionExistente = await _context.ConfiguracionListasMaestras
                .FirstOrDefaultAsync(l => l.CategoriaId == categoriaId
                                       && l.Opcion.ToLower() == opcion.ToLower());

            if (opcionExistente != null)
            {
                return (true, "La opción ya existe en esta categoría.", MapListaItem(opcionExistente, categoria));
            }

            var nuevaLista = new ConfiguracionListaMaestra
            {
                CategoriaId = categoriaId,
                Opcion = opcion,
                Modulo = dto.Modulo,
                CreatedAt = DateTime.UtcNow
            };

            _context.ConfiguracionListasMaestras.Add(nuevaLista);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                var existente = await _context.ConfiguracionListasMaestras
                    .FirstOrDefaultAsync(l => l.CategoriaId == categoriaId
                                           && l.Opcion.ToLower() == opcion.ToLower());

                if (existente != null)
                {
                    return (true, "La opción ya existe en esta categoría.", MapListaItem(existente, categoria));
                }

                throw;
            }

            return (true, "Registro guardado exitosamente", MapListaItem(nuevaLista, categoria));
        }

        public async Task<ListaItemDto> UpdateListaAsync(int id, UpdateListaMaestraDto dto)
        {
            var lista = await _context.ConfiguracionListasMaestras
                .Include(l => l.Categoria)
                .FirstOrDefaultAsync(l => l.ListaId == id);

            if (lista == null)
            {
                throw new KeyNotFoundException("Lista no encontrada");
            }

            var opcion = dto.Opcion?.Trim();

            if (string.IsNullOrWhiteSpace(opcion))
            {
                throw new ArgumentException("La opción es obligatoria");
            }

            lista.Opcion = opcion;
            lista.Modulo = dto.Modulo;
            _context.Entry(lista).State = EntityState.Modified;

            var duplicada = await _context.ConfiguracionListasMaestras
                .AnyAsync(l => l.ListaId != id
                            && l.CategoriaId == lista.CategoriaId
                            && l.Opcion.ToLower() == opcion.ToLower());

            if (duplicada)
            {
                throw new InvalidOperationException($"La opción '{opcion}' ya existe en esta categoría.");
            }

            if (!string.IsNullOrWhiteSpace(dto.Categoria) && lista.Categoria != null)
            {
                lista.Categoria.Nombre = dto.Categoria.Trim();
            }

            await _context.SaveChangesAsync();

            return MapListaItem(lista, lista.Categoria);
        }

        public async Task UpdateCategoriaAsync(int id, UpdateCategoriaDto dto)
        {
            var categoria = await _context.CatCategoriasListas
                .FirstOrDefaultAsync(c => c.CategoriaId == id);

            if (categoria == null)
            {
                throw new KeyNotFoundException($"Categoría con ID {id} no encontrada");
            }

            if (!string.IsNullOrWhiteSpace(dto.Nombre))
            {
                categoria.Nombre = dto.Nombre.Trim();
            }

            await _context.SaveChangesAsync();
        }

        public async Task DeleteListaAsync(int id)
        {
            var rowsAffected = await _context.ConfiguracionListasMaestras
                .Where(l => l.ListaId == id)
                .ExecuteDeleteAsync();

            if (rowsAffected == 0)
            {
                throw new KeyNotFoundException("Opción no encontrada");
            }
        }

        public async Task<CatCategoriaLista> DeleteCategoriaAsync(int categoriaId)
        {
            var categoria = await _context.CatCategoriasListas
                .FirstOrDefaultAsync(c => c.CategoriaId == categoriaId);

            if (categoria == null)
            {
                throw new KeyNotFoundException("Categoría no encontrada");
            }

            _context.CatCategoriasListas.Remove(categoria);
            await _context.SaveChangesAsync();

            return categoria;
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
