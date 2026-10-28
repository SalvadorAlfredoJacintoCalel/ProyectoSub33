using System.Net.Http;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend_Sub33.Services;

public class EmailService : IEmailService
{
    private const string BrevoEmailUrl = "https://api.brevo.com/v3/smtp/email";
    private const string BrevoSenderName = "Subestación 33";
    private const string BrevoSenderEmail = "sjacintoc@miumg.edu.gt";

    private static readonly HttpClient Http = new()
    {
        Timeout = TimeSpan.FromSeconds(30)
    };

    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public Task<bool> EnviarCodigoOtpAsync(string correoDestino, string nombreUsuario, string codigoOtp, CancellationToken ct = default)
    {
        var subject = "Código de verificación - Subestación 33";
        var html = BuildCodigoOtpHtml(nombreUsuario, codigoOtp);
        return EnviarAsync(correoDestino, subject, html, ct);
    }

    public Task<bool> EnviarCredencialesAsync(string correoDestino, string primerNombre, string nombreUsuario, string contrasenaTemporal, bool esCuentaNueva = false, CancellationToken ct = default)
    {
        var subject = esCuentaNueva
            ? "Tus credenciales de acceso - Subestación 33"
            : "Tus credenciales de acceso se actualizaron - Subestación 33";
        var html = BuildCredencialesHtml(primerNombre, nombreUsuario, contrasenaTemporal, esCuentaNueva);
        return EnviarAsync(correoDestino, subject, html, ct);
    }

    private async Task<bool> EnviarAsync(string correoDestino, string subject, string html, CancellationToken ct)
    {
        var apiKey = _configuration["Brevo:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("Falta Brevo:ApiKey; no se envió el correo a {Destino}", correoDestino);
            return false;
        }

        var payload = new
        {
            sender = new { name = BrevoSenderName, email = BrevoSenderEmail },
            to = new[] { new { email = correoDestino } },
            subject,
            htmlContent = html
        };

        var json = JsonSerializer.Serialize(payload);

        using var request = new HttpRequestMessage(HttpMethod.Post, BrevoEmailUrl)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        request.Headers.TryAddWithoutValidation("api-key", apiKey);

        try
        {
            using var response = await Http.SendAsync(request, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "Brevo respondió {StatusCode} al enviar correo a {Destino}: {Body}",
                    (int)response.StatusCode, correoDestino, body);
                return false;
            }

            _logger.LogInformation("Correo enviado a {Destino} vía Brevo.", correoDestino);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al enviar correo a {Destino} vía Brevo.", correoDestino);
            return false;
        }
    }

    private static string BuildCodigoOtpHtml(string nombreUsuario, string codigoOtp)
    {
        var nombreMostrado = string.IsNullOrWhiteSpace(nombreUsuario) ? "Usuario" : nombreUsuario;

        return $"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background-color:#f0efed;font-family:Arial,Helvetica,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0efed;padding:24px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
                  <tr>
                    <td style="background-color:#1b2e4b;padding:24px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:1px;">SUBESTACIÓN 33</h1>
                      <p style="margin:6px 0 0;color:#f5c500;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Bomberos Voluntarios · San Lucas Tolimán, Sololá</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 28px;">
                      <p style="margin:0 0 8px;color:#1b1b1c;font-size:15px;">Hola, <strong>{nombreMostrado}</strong>:</p>
                      <p style="margin:0 0 24px;color:#71717a;font-size:14px;line-height:1.6;">
                        Recibimos una solicitud para cambiar tu contraseña. Usa el siguiente código para completar la verificación:
                      </p>
                      <div style="background-color:#fff1f0;border:1px solid #c11d1d;border-radius:10px;padding:20px;text-align:center;">
                        <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#c11d1d;">{codigoOtp}</span>
                      </div>
                      <p style="margin:24px 0 0;color:#71717a;font-size:13px;line-height:1.6;">
                        Este código expira en <strong>3 minutos</strong>. Si no solicitaste este cambio, ignora este mensaje.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#7a0000;padding:16px;text-align:center;">
                      <p style="margin:0;color:#ffffff;font-size:12px;">Siempre al servicio de nuestra comunidad</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """;
    }

    private static string BuildCredencialesHtml(string primerNombre, string nombreUsuario, string contrasenaTemporal, bool esCuentaNueva)
    {
        var nombre = string.IsNullOrWhiteSpace(primerNombre) ? "Usuario" : primerNombre;
        var cuerpo = esCuentaNueva
            ? "Se ha creado tu cuenta en el sistema. A continuación encontrarás tus credenciales de acceso temporal:"
            : "Tus credenciales de acceso han sido actualizadas. A continuación encontrarás tu usuario y tu nueva contraseña temporal:";
        var aviso = esCuentaNueva
            ? "Por seguridad, cambia tu contraseña después del primer inicio de sesión."
            : "Por seguridad, cambia tu contraseña después de iniciar sesión.";

        return $"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background-color:#f0efed;font-family:Arial,Helvetica,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0efed;padding:24px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
                  <tr>
                    <td style="background-color:#1B365D;padding:24px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:1px;">SUBESTACIÓN 33</h1>
                      <p style="margin:6px 0 0;color:#f5c500;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Bomberos Voluntarios · San Lucas Tolimán, Sololá</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 28px;">
                      <p style="margin:0 0 8px;color:#1b1b1c;font-size:15px;">Hola, <strong>{nombre}</strong>:</p>
                      <p style="margin:0 0 24px;color:#71717a;font-size:14px;line-height:1.6;">
                        {cuerpo}
                      </p>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f7f9fc;border:1px solid #e4e4e7;border-radius:10px;">
                        <tr>
                          <td style="padding:14px 16px;border-bottom:1px solid #e4e4e7;color:#71717a;font-size:13px;">Usuario</td>
                          <td style="padding:14px 16px;border-bottom:1px solid #e4e4e7;color:#1b1b1c;font-size:15px;font-weight:bold;text-align:right;">{nombreUsuario}</td>
                        </tr>
                        <tr>
                          <td style="padding:14px 16px;color:#71717a;font-size:13px;">Contraseña temporal</td>
                          <td style="padding:14px 16px;color:#1b1b1c;font-size:15px;font-weight:bold;text-align:right;">{contrasenaTemporal}</td>
                        </tr>
                      </table>
                      <p style="margin:24px 0 0;color:#71717a;font-size:13px;line-height:1.6;">
                        {aviso}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#8B0000;padding:16px;text-align:center;">
                      <p style="margin:0;color:#ffffff;font-size:12px;">Siempre al servicio de nuestra comunidad</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """;
    }
}
