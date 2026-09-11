using Backend_Sub33.DTOs.Configuracion;
using Backend_Sub33.Models.Entities;
using Backend_Sub33.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend_Sub33.Controllers
{
    [ApiController]
    [Route("api/configuracion")]
    public class ConfiguracionController : ControllerBase
    {
        private readonly IConfiguracionService _service;

        public ConfiguracionController(IConfiguracionService service)
        {
            _service = service;
        }

        [HttpGet("listas")]
        public async Task<ActionResult<List<ListaMaestraDto>>> GetListas()
        {
            return Ok(await _service.GetAllListasAsync());
        }

        [HttpGet("listas/{categoria}")]
        public async Task<ActionResult<List<ListaMaestraDto>>> GetListasPorCategoria(string categoria)
        {
            return Ok(await _service.GetPorCategoriaAsync(categoria));
        }

        [HttpPost("listas")]
        public async Task<ActionResult> CrearLista(CreateListaMaestraDto dto)
        {
            await _service.CreateListaAsync(dto);
            return Ok(new { exito = true, mensaje = "Lista creada correctamente" });
        }

        [HttpPut("listas/{id}")]
        public async Task<ActionResult> ActualizarLista(int id, UpdateListaMaestraDto dto)
        {
            await _service.UpdateListaAsync(id, dto);
            return Ok(new { exito = true, mensaje = "Lista actualizada correctamente" });
        }

        [HttpDelete("listas/{id}")]
        public async Task<ActionResult> EliminarLista(int id)
        {
            await _service.DeleteListaAsync(id);
            return Ok(new { exito = true, mensaje = "Lista dada de baja correctamente" });
        }

        [HttpGet("rangos")]
        public async Task<ActionResult<List<CatRango>>> GetRangos()
        {
            return Ok(await _service.GetRangosAsync());
        }

        [HttpGet("hospitales")]
        public async Task<ActionResult<List<CatHospital>>> GetHospitales()
        {
            return Ok(await _service.GetHospitalesAsync());
        }

        [HttpGet("tipos-emergencia")]
        public async Task<ActionResult<List<CatTipoEmergencia>>> GetTiposEmergencia()
        {
            return Ok(await _service.GetTiposEmergenciaAsync());
        }
    }
}