namespace Backend_Sub33.Services;

public interface IEmailService
{
    Task EnviarCodigoOtpAsync(string correoDestino, string nombreUsuario, string codigoOtp, CancellationToken ct = default);
}
