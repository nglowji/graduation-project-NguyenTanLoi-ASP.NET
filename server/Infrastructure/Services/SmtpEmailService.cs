using Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Mail;

namespace Infrastructure.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        try
        {
            var smtpHost = _configuration["Email:Host"];
            var smtpPort = int.Parse(_configuration["Email:Port"] ?? "587");
            var smtpUser = _configuration["Email:Username"];
            var smtpPass = _configuration["Email:Password"];
            var displayName = _configuration["Email:DisplayName"] ?? "SmartSport Platform";

            if (string.IsNullOrEmpty(smtpHost) || string.IsNullOrEmpty(smtpUser))
            {
                _logger.LogWarning("SMTP is not configured. Email to {To} was not sent. Body: {Body}", to, body);
                return;
            }

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                Credentials = new NetworkCredential(smtpUser, smtpPass),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(smtpUser!, displayName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            mailMessage.To.Add(to);

            await client.SendMailAsync(mailMessage, cancellationToken);
            _logger.LogInformation("Email sent successfully to {To}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
            // We don't throw here to avoid breaking the main transaction, 
            // but in a real system we might use a background job/queue.
        }
    }

    public async Task SendMultiSlotBookingConfirmationAsync(
        string email, 
        string userName, 
        string pitchName, 
        int slotCount, 
        DateOnly bookingDate, 
        CancellationToken cancellationToken = default)
    {
        var subject = $"Xác nhận đặt {slotCount} khung giờ - SmartSport";
        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2>Xin chào {userName},</h2>
                <p>Cảm ơn bạn đã đặt sân tại <strong>{pitchName}</strong>!</p>
                <p><strong>Chi tiết đặt sân:</strong></p>
                <ul>
                    <li>Số khung giờ: <strong>{slotCount} khung giờ</strong></li>
                    <li>Ngày đặt: <strong>{bookingDate:dd/MM/yyyy}</strong></li>
                </ul>
                <p>Vui lòng kiểm tra email để hoàn tất thanh toán cọc và nhận mã check-in.</p>
                <p>Trân trọng,<br/>Đội ngũ SmartSport</p>
            </body>
            </html>";

        await SendEmailAsync(email, subject, body, cancellationToken);
    }
}
