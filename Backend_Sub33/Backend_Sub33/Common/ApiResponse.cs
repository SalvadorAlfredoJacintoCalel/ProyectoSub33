namespace Backend_Sub33.Common;

/// <summary>
/// Envoltorio unificado de respuesta JSON para toda la API:
/// { "success": bool, "message": string, "data": object }
/// </summary>
public class ApiResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public object? Data { get; set; }

    public static ApiResponse Ok(object? data, string message = "Operación exitosa")
        => new() { Success = true, Message = message, Data = data };

    public static ApiResponse Fail(string message)
        => new() { Success = false, Message = message };
}
