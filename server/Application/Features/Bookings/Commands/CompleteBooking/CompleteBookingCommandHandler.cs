using Application.Common.DTOs;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Bookings.Commands.CompleteBooking;

public class CompleteBookingCommandHandler : IRequestHandler<CompleteBookingCommand, Result>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IUserRepository _userRepository;
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<CompleteBookingCommandHandler> _logger;

    public CompleteBookingCommandHandler(
        IBookingRepository bookingRepository,
        IUserRepository userRepository,
        IApplicationDbContext context,
        IEmailService emailService,
        ILogger<CompleteBookingCommandHandler> logger)
    {
        _bookingRepository = bookingRepository;
        _userRepository = userRepository;
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<Result> Handle(CompleteBookingCommand request, CancellationToken cancellationToken)
    {
        var booking = await _bookingRepository.GetTrackedWithDetailsAsync(request.BookingId, cancellationToken);

        if (booking == null)
            return Result.Failure("Booking not found");

        var requester = await _userRepository.GetByIdAsync(request.RequesterId, cancellationToken);
        if (requester == null)
            return Result.Failure("User not found");

        var pitchOwnerId = booking.TimeSlot?.Pitch?.OwnerId;
        if (pitchOwnerId == null)
            return Result.Failure("Pitch owner not found");

        var isAuthorized = requester.Id == pitchOwnerId
            || requester.IsAdmin()
            || (requester.IsPitchStaff() && requester.OwnerId == pitchOwnerId);

        if (!isAuthorized)
            return Result.Failure("You are not authorized to complete this booking");

        try
        {
            booking.Complete();
            await _context.SaveChangesAsync(cancellationToken);
            await SendBookingCompletedEmailAsync(booking, cancellationToken);

            _logger.LogInformation(
                "Booking {BookingId} completed by owner {OwnerId}",
                booking.Id,
                pitchOwnerId
            );

            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing booking {BookingId}", request.BookingId);
            return Result.Failure(ex.Message);
        }
    }

    private async Task SendBookingCompletedEmailAsync(Domain.Entities.Booking booking, CancellationToken cancellationToken)
    {
        try
        {
            if (booking.User == null || string.IsNullOrWhiteSpace(booking.User.Email))
                return;

            var pitchName = booking.TimeSlot?.Pitch?.Name ?? "SmartSport";
            var subject = $"[SmartSport] Don dat san da hoan thanh - {pitchName}";
            var body = $"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #16a34a; color: white; padding: 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">SmartSport</h1>
                <p style="margin: 8px 0 0; opacity: 0.9;">Don dat san da hoan thanh va duoc ghi nhan thanh toan du</p>
              </div>
              <div style="padding: 32px;">
                <h2 style="margin: 0 0 16px; color: #1e293b;">Chao {booking.User.FullName},</h2>
                <p style="color: #475569; line-height: 1.6;">Cam on ban da su dung SmartSport. Don dat san cua ban da hoan thanh. Hay de lai danh gia de giup san phuc vu tot hon.</p>
                <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0;">
                  <p style="margin: 0 0 8px; color: #64748b;">San: <strong style="color: #0f172a;">{pitchName}</strong></p>
                  <p style="margin: 0 0 8px; color: #64748b;">Ngay: <strong style="color: #0f172a;">{booking.BookingDate:dd/MM/yyyy}</strong></p>
                  <p style="margin: 0; color: #64748b;">Tong da thanh toan: <strong style="color: #16a34a;">{booking.TotalPrice.Amount:N0} VND</strong></p>
                </div>
              </div>
            </div>
            """;

            await _emailService.SendEmailAsync(booking.User.Email, subject, body, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send booking completed email for booking {BookingId}", booking.Id);
        }
    }
}
