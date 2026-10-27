using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Backend_Sub33.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task EnviarCodigoOtpAsync(string correoDestino, string nombreUsuario, string codigoOtp, CancellationToken ct = default)
    {
        var host = _configuration["Smtp:Host"];
        var portRaw = _configuration["Smtp:Port"];
        var user = _configuration["Smtp:User"];
        var password = _configuration["Smtp:Password"];
        var fromName = _configuration["Smtp:FromName"] ?? "Subestación 33";

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(password))
        {
            _logger.LogWarning("Configuración SMTP incompleta; no se envió el correo a {Destino}", correoDestino);
            return;
        }

        if (!int.TryParse(portRaw, out var port))
        {
            port = 587;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, user));
        message.To.Add(MailboxAddress.Parse(correoDestino));
        message.Subject = "Código de verificación - Subestación 33";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = BuildHtml(nombreUsuario, codigoOtp)
        };
        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        client.CheckCertificateRevocation = false;
        var secureOptions = port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
        await client.ConnectAsync(host, port, secureOptions, ct);
        await client.AuthenticateAsync(user, password, ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }

    private static string BuildHtml(string nombreUsuario, string codigoOtp)
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
}
