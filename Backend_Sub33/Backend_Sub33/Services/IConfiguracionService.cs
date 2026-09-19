using Backend_Sub33.DTOs.Configuracion;
using Backend_Sub33.Models.Entities;

namespace Backend_Sub33.Services
{
    public interface IConfiguracionService
    {
        Task<List<ListaItemDto>> GetAllListasAsync();
        Task<List<ListaItemDto>> GetPorCategoriaAsync(int categoriaId);
        Task<List<CatCategoriaLista>> GetCategoriasAsync();
        Task<(bool exito, string mensaje, ListaItemDto? item)> CrearListaAsync(CreateListaMaestraDto dto);
        Task UpdateListaAsync(int id, UpdateListaMaestraDto dto);
        Task DeleteListaAsync(int id);
        Task<List<CatRango>> GetRangosAsync();
        Task<List<CatHospital>> GetHospitalesAsync();
        Task<List<CatTipoEmergencia>> GetTiposEmergenciaAsync();
    }
}