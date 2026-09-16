using Backend_Sub33.DTOs.Configuracion;
using Backend_Sub33.Models.Entities;
using Backend_Sub33.Data;

namespace Backend_Sub33.Services
{
    public interface IConfiguracionService
    {
        Task<List<ListaItemDto>> GetAllListasAsync();
        Task<List<ListaItemDto>> GetPorCategoriaAsync(string categoria);
        Task<List<string>> GetCategoriasAsync();
        Task<(bool exito, string mensaje)> CrearListaAsync(string categoria, string opcion);
        Task UpdateListaAsync(int id, UpdateListaMaestraDto dto);
        Task DeleteListaAsync(int id);
        Task<List<CatRango>> GetRangosAsync();
        Task<List<CatHospital>> GetHospitalesAsync();
        Task<List<CatTipoEmergencia>> GetTiposEmergenciaAsync();
    }
}