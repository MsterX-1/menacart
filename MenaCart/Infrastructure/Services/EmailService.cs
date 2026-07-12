using Application.Interfaces.IServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly IConfiguration _config;

        public EmailService(ILogger<EmailService> logger, IConfiguration config)
        {
            _logger = logger;
            _config = config;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                var host = _config["Smtp:Host"];
                var portStr = _config["Smtp:Port"];
                var username = _config["Smtp:Username"];
                var password = _config["Smtp:Password"];

                if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
                {
                    _logger.LogWarning("SMTP configuration is missing. Falling back to mock email.");
                    _logger.LogInformation("--- MOCK EMAIL SENT ---");
                    _logger.LogInformation("To: {toEmail}", toEmail);
                    _logger.LogInformation("Subject: {subject}", subject);
                    _logger.LogInformation("Body: {body}", body);
                    _logger.LogInformation("-----------------------");
                    return;
                }

                int port = int.TryParse(portStr, out int p) ? p : 587;
                bool enableSsl = bool.TryParse(_config["Smtp:EnableSsl"], out bool ssl) ? ssl : true;

                using var client = new SmtpClient(host, port)
                {
                    Credentials = new NetworkCredential(username, password),
                    EnableSsl = enableSsl
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(username, "MenaCart"),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true,
                };
                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("Email successfully sent to {toEmail}", toEmail);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {toEmail}", toEmail);
                throw;
            }
        }
    }
}
