using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Backend_Sub33.Common;

namespace Backend_Sub33.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    protected IActionResult Respond<T>(ServiceResult<T> result, string successMessage = "Operación exitosa", int successStatusCode = StatusCodes.Status200OK)
    {
        if (result.IsSuccess)
        {
            return StatusCode(successStatusCode, ApiResponse.Ok(result.Data, successMessage));
        }

        return StatusCode(result.StatusCode, ApiResponse.Fail(result.Error ?? "Ha ocurrido un error inesperado."));
    }

    protected IActionResult Respond(ServiceResult result, string successMessage = "Operación exitosa", int successStatusCode = StatusCodes.Status200OK)
    {
        if (result.IsSuccess)
        {
            return StatusCode(successStatusCode, ApiResponse.Ok(null, successMessage));
        }

        return StatusCode(result.StatusCode, ApiResponse.Fail(result.Error ?? "Ha ocurrido un error inesperado."));
    }

    protected IActionResult InvalidModel(ModelStateDictionary modelState)
    {
        var mensaje = modelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .FirstOrDefault(m => !string.IsNullOrWhiteSpace(m))
            ?? "La solicitud contiene datos inválidos.";

        return BadRequest(ApiResponse.Fail(mensaje));
    }
}
