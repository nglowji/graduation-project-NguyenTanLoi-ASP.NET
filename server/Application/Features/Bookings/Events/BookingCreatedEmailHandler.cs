using Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Bookings.Events;

/// <summary>
/// Handles sending booking confirmation email with QR code after booking creation.
/// Runs as a fire-and-forget side effect — failure does not rollback the booking.
/// </summary>
public class BookingCreatedEmailHandler : INotificationHandler<BookingCreatedNotification>
{
    private readonly IUserRepository _userRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly ITimeSlotRepository _timeSlotRepository;
    private readonly IEmailService _emailService;
    private readonly IQRService _qrService;
    private readonly ILogger<BookingCreatedEmailHandler> _logger;

    public BookingCreatedEmailHandler(
        IUserRepository userRepository,
        IBookingRepository bookingRepository,
        ITimeSlotRepository timeSlotRepository,
        IEmailService emailService,
        IQRService qrService,
        ILogger<BookingCreatedEmailHandler> logger)
    {
        _userRepository = userRepository;
        _bookingRepository = bookingRepository;
        _timeSlotRepository = timeSlotRepository;
        _emailService = emailService;
        _qrService = qrService;
        _logger = logger;
    }

    public async Task Handle(BookingCreatedNotification notification, CancellationToken cancellationToken)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(notification.UserId, cancellationToken);
            if (user == null || string.IsNullOrEmpty(user.Email))
                return;

            var booking = await _bookingRepository.GetByIdAsync(notification.BookingId, cancellationToken);
            var timeSlot = await _timeSlotRepository.GetByIdAsync(notification.TimeSlotId, cancellationToken);

            if (booking == null || timeSlot == null)
                return;

            var qrCodeBase64 = _qrService.GenerateQRCodeBase64(booking.CheckInCode!);
            var pitchName = timeSlot.Pitch?.Name ?? "N/A";

            var subject = "Xác nhận đặt sân thành công - SmartSport";
            var body = BuildEmailBody(user.FullName, pitchName, notification.BookingDate,
                timeSlot.TimeRange.ToString(), booking.CheckInCode!, booking.TotalPrice.Amount, qrCodeBase64);

            await _emailService.SendEmailAsync(user.Email, subject, body, cancellationToken);

            _logger.LogInformation(
                "Booking confirmation email sent to {Email} for booking {BookingId}",
                user.Email, notification.BookingId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to send booking confirmation email for booking {BookingId}",
                notification.BookingId);
        }
    }

    private static string BuildEmailBody(
        string customerName, string pitchName, DateOnly bookingDate,
        string timeRange, string checkInCode, decimal totalAmount, string qrCodeBase64) =>
        $"""
        <h1>Chúc mừng {customerName}!</h1>
        <p>Bạn đã đặt sân thành công tại SmartSport.</p>
        <p><b>Thông tin đơn hàng:</b></p>
        <ul>
            <li>Sân: {pitchName}</li>
            <li>Ngày: {bookingDate:dd/MM/yyyy}</li>
            <li>Khung giờ: {timeRange}</li>
            <li>Mã Check-in: <b>{checkInCode}</b></li>
            <li>Tổng tiền: {totalAmount:N0} VND</li>
        </ul>
        <p>Vui lòng xuất trình mã QR dưới đây khi đến sân:</p>
        <img src="data:image/png;base64,{qrCodeBase64}" alt="QR Check-in" />
        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
        """;
}
