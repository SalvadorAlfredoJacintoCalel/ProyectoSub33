namespace Backend_Sub33.Common;

/// <summary>
/// Resultado de una operación de servicio sin valor de retorno.
/// </summary>
public class ServiceResult
{
    public bool IsSuccess { get; }
    public string? Error { get; }
    public int StatusCode { get; }

    protected ServiceResult(bool isSuccess, string? error, int statusCode)
    {
        IsSuccess = isSuccess;
        Error = error;
        StatusCode = statusCode;
    }

    public static ServiceResult Success() => new(true, null, 200);
    public static ServiceResult Failure(string error, int statusCode = 400) => new(false, error, statusCode);
    public static ServiceResult BadRequest(string error) => Failure(error, 400);
    public static ServiceResult NotFound(string error) => Failure(error, 404);
    public static ServiceResult Conflict(string error) => Failure(error, 409);
    public static ServiceResult Internal(string error) => Failure(error, 500);
}

/// <summary>
/// Resultado de una operación de servicio con valor de retorno tipado.
/// </summary>
public class ServiceResult<T> : ServiceResult
{
    public T? Data { get; }

    private ServiceResult(bool isSuccess, T? data, string? error, int statusCode)
        : base(isSuccess, error, statusCode)
    {
        Data = data;
    }

    public static ServiceResult<T> Success(T data) => new(true, data, null, 200);
    public new static ServiceResult<T> Failure(string error, int statusCode = 400) => new(false, default, error, statusCode);
    public new static ServiceResult<T> BadRequest(string error) => Failure(error, 400);
    public new static ServiceResult<T> NotFound(string error) => Failure(error, 404);
    public new static ServiceResult<T> Conflict(string error) => Failure(error, 409);
    public new static ServiceResult<T> Internal(string error) => Failure(error, 500);

    public static ServiceResult<T> From(ServiceResult result)
        => new(result.IsSuccess, default, result.Error, result.StatusCode);
}
