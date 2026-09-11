using Backend_Sub33.DTOs.Configuracion;
using Backend_Sub33.Models.Entities;
using Backend_Sub33.Data;

namespace Backend_Sub33.Services
{
    public interface IConfiguracionService
    {
        Task<List<ListaMaestraDto>> GetAllListasAsync();
        Task<List<ListaMaestraDto>> GetPorCategoriaAsync(string categoria);
        Task CreateListaAsync(CreateListaMaestraDto dto);
        Task UpdateListaAsync(int id, UpdateListaMaestraDto dto);
        Task DeleteListaAsync(int id);
        Task<List<CatRango>> GetRangosAsync();
        Task<List<CatHospital>> GetHospitalesAsync();
        Task<List<CatTipoEmergencia>> GetTiposEmergenciaAsync();
    }
}