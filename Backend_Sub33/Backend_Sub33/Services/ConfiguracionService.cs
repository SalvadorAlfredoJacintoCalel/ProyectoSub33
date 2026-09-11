using Backend_Sub33.DTOs.Configuracion;
using Backend_Sub33.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Backend_Sub33.Data;

namespace Backend_Sub33.Services
{
    public class ConfiguracionService : IConfiguracionService
    {
        private readonly AppDbContext _context;

        public ConfiguracionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<ListaMaestraDto>> GetAllListasAsync()
        {
            return await _context.ConfiguracionListasMaestras
                .Where(l => l.Activo)
                .Select(l => new ListaMaestraDto
                {
                    ListaId = l.ListaId,
                    Categoria = l.Categoria,
                    Opcion = l.Opcion,
                    Activo = l.Activo
                })
                .ToListAsync();
        }

        public async Task<List<ListaMaestraDto>> GetPorCategoriaAsync(string categoria)
        {
            return await _context.ConfiguracionListasMaestras
                .Where(l => l.Categoria == categoria && l.Activo)
                .Select(l => new ListaMaestraDto
                {
                    ListaId = l.ListaId,
                    Categoria = l.Categoria,
                    Opcion = l.Opcion,
                    Activo = l.Activo
                })
                .ToListAsync();
        }

        public async Task CreateListaAsync(CreateListaMaestraDto dto)
        {
            var entity = new ConfiguracionListaMaestra
            {
                Categoria = dto.Categoria,
                Opcion = dto.Opcion,
                Activo = true
            };

            _context.ConfiguracionListasMaestras.Add(entity);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateListaAsync(int id, UpdateListaMaestraDto dto)
        {
            var entity = await _context.ConfiguracionListasMaestras.FindAsync(id)
                ?? throw new KeyNotFoundException("Lista no encontrada");

            entity.Opcion = dto.Opcion;
            entity.Activo = dto.Activo;

            _context.ConfiguracionListasMaestras.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteListaAsync(int id)
        {
            var entity = await _context.ConfiguracionListasMaestras.FindAsync(id)
                ?? throw new KeyNotFoundException("Lista no encontrada");

            entity.Activo = false;
            _context.ConfiguracionListasMaestras.Update(entity);
            await _context.SaveChangesAsync();
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