using Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Payments.Notifications;

public class PaymentSucceededNotificationHandler : INotificationHandler<PaymentSucceededNotification>
{
    private readonly IEmailService _emailService;
    private readonly ILogger<PaymentSucceededNotificationHandler> _logger;

    public PaymentSucceededNotificationHandler(IEmailService emailService, ILogger<PaymentSucceededNotificationHandler> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public async Task Handle(PaymentSucceededNotification notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Sending confirmation email for booking {BookingId}", notification.BookingId);

        var subject = $"[SmartSport] Xác nhận đặt sân thành công - {notification.PitchName}";
        
        var body = $@"
            <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;'>
                <div style='background-color: #0f172a; color: white; padding: 24px; text-align: center;'>
                    <h1 style='margin: 0; font-size: 24px;'>SmartSport</h1>
                    <p style='margin: 8px 0 0; opacity: 0.8;'>Cảm ơn bạn đã tin dùng dịch vụ của chúng tôi</p>
                </div>
                <div style='padding: 32px;'>
                    <h2 style='margin: 0 0 16px; color: #1e293b;'>Chào {notification.CustomerName},</h2>
                    <p style='color: #475569; line-height: 1.6;'>Chúng tôi vui mừng thông báo rằng yêu cầu đặt sân của bạn đã được thanh toán thành công và xác nhận.</p>
                    
                    <div style='background-color: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0;'>
                        <h3 style='margin: 0 0 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b;'>Thông tin đặt sân</h3>
                        <table style='width: 100%; border-collapse: collapse;'>
                            <tr>
                                <td style='padding: 8px 0; color: #64748b;'>Sân bóng:</td>
                                <td style='padding: 8px 0; font-weight: bold; text-align: right;'>{notification.PitchName}</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; color: #64748b;'>Ngày:</td>
                                <td style='padding: 8px 0; font-weight: bold; text-align: right;'>{notification.BookingDate}</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; color: #64748b;'>Khung giờ:</td>
                                <td style='padding: 8px 0; font-weight: bold; text-align: right;'>{notification.TimeSlot}</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; color: #64748b;'>Số tiền đã thanh toán:</td>
                                <td style='padding: 8px 0; font-weight: bold; text-align: right; color: #10b981;'>{notification.Amount:N0} VNĐ</td>
                            </tr>
                        </table>
                    </div>

                    <p style='color: #475569; line-height: 1.6;'>Vui lòng đến đúng giờ và mang theo mã QR trong ứng dụng để nhận sân.</p>
                    
                    <div style='text-align: center; margin-top: 32px;'>
                        <a href='#' style='background-color: #3b82f6; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;'>Xem chi tiết đặt sân</a>
                    </div>
                </div>
                <div style='background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;'>
                    &copy; 2026 SmartSport Platform. Mọi quyền được bảo lưu.
                </div>
            </div>
        ";

        await _emailService.SendEmailAsync(notification.CustomerEmail, subject, body, cancellationToken);
    }
}
