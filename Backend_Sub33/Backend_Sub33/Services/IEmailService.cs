namespace Backend_Sub33.Services;

public interface IEmailService
{
    Task<bool> EnviarCodigoOtpAsync(string correoDestino, string nombreUsuario, string codigoOtp, CancellationToken ct = default);

    Task<bool> EnviarCredencialesAsync(string correoDestino, string primerNombre, string nombreUsuario, string contrasenaTemporal, CancellationToken ct = default);
}
