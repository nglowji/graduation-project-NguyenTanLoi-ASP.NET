using Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Payments.Notifications;

public class PaymentSucceededNotificationHandler : INotificationHandler<PaymentSucceededNotification>
{
    private readonly IEmailService _emailService;
    private readonly ILogger<PaymentSucceededNotificationHandler> _logger;

    public PaymentSucceededNotificationHandler(
        IEmailService emailService,
        ILogger<PaymentSucceededNotificationHandler> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public async Task Handle(PaymentSucceededNotification notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Sending paid booking confirmation email for booking {BookingId}", notification.BookingId);

        var subject = $"[SmartSport] Xac nhan dat san thanh cong - {notification.PitchName}";
        var body = BuildEmailBody(notification);

        await _emailService.SendEmailAsync(notification.CustomerEmail, subject, body, cancellationToken);
    }

    private static string BuildEmailBody(PaymentSucceededNotification notification) =>
        $"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #0f172a; color: white; padding: 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">SmartSport</h1>
                <p style="margin: 8px 0 0; opacity: 0.85;">Thanh toan coc thanh cong qua VNPAY</p>
            </div>
            <div style="padding: 32px;">
                <h2 style="margin: 0 0 16px; color: #1e293b;">Chao {notification.CustomerName},</h2>
                <p style="color: #475569; line-height: 1.6;">
                    Tien coc 10% cua ban da duoc thanh toan thanh cong. Don dat san da duoc xac nhan.
                </p>

                <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0;">
                    <h3 style="margin: 0 0 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b;">Thong tin dat san</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b;">San:</td>
                            <td style="padding: 8px 0; font-weight: bold; text-align: right;">{notification.PitchName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b;">Ngay:</td>
                            <td style="padding: 8px 0; font-weight: bold; text-align: right;">{notification.BookingDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b;">Khung gio:</td>
                            <td style="padding: 8px 0; font-weight: bold; text-align: right;">{notification.TimeSlot}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b;">Tien coc da thanh toan:</td>
                            <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #10b981;">{notification.Amount:N0} VND</td>
                        </tr>
                    </table>
                </div>

                <p style="color: #475569; line-height: 1.6;">
                    Vui long den dung gio. Phan con lai se thanh toan truc tiep tai san theo chinh sach cua chu san.
                </p>
            </div>
            <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
                &copy; 2026 SmartSport Platform.
            </div>
        </div>
        """;
}
