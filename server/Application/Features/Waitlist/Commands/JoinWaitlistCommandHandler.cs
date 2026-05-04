using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Waitlist.Commands.JoinWaitlist;

public class JoinWaitlistCommandHandler : IRequestHandler<JoinWaitlistCommand, Result<Guid>>
{
    private readonly IWaitlistRepository _waitlistRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly ITimeSlotRepository _timeSlotRepository;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<JoinWaitlistCommandHandler> _logger;

    public JoinWaitlistCommandHandler(
        IWaitlistRepository waitlistRepository,
        IBookingRepository bookingRepository,
        ITimeSlotRepository timeSlotRepository,
        IApplicationDbContext context,
        ILogger<JoinWaitlistCommandHandler> logger)
    {
        _waitlistRepository = waitlistRepository;
        _bookingRepository = bookingRepository;
        _timeSlotRepository = timeSlotRepository;
        _context = context;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(JoinWaitlistCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // 1. Verify time slot exists
            var timeSlot = await _timeSlotRepository.GetByIdAsync(request.TimeSlotId, cancellationToken);
            if (timeSlot == null)
                return Result<Guid>.Failure("Time slot not found");

            // 2. Check if slot is actually full
            var isAvailable = await _bookingRepository.IsTimeSlotAvailableAsync(request.TimeSlotId, request.Date, cancellationToken);
            if (isAvailable)
                return Result<Guid>.Failure("This time slot is currently available. You should book it directly.");

            // 3. Check if user is already on waitlist for this slot/date
            var isOnWaitlist = await _waitlistRepository.IsUserOnWaitlistAsync(request.UserId, request.TimeSlotId, request.Date, cancellationToken);
            if (isOnWaitlist)
                return Result<Guid>.Failure("You are already on the waitlist for this time slot.");

            // 4. Join waitlist
            var entry = WaitlistEntry.Create(request.UserId, request.TimeSlotId, request.Date);
            
            await _waitlistRepository.AddAsync(entry, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("User {UserId} joined waitlist for slot {TimeSlotId} on {Date}", request.UserId, request.TimeSlotId, request.Date);

            return Result<Guid>.Success(entry.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining waitlist");
            return Result<Guid>.Failure("Failed to join waitlist. Please try again.");
        }
    }
}
