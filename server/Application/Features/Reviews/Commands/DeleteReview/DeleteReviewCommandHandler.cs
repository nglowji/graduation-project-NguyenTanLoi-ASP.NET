using Application.Common.DTOs;
using Application.Common.Interfaces;
using Application.Features.Reviews;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Reviews.Commands.DeleteReview;

public class DeleteReviewCommandHandler : IRequestHandler<DeleteReviewCommand, Result>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IApplicationDbContext _context;

    public DeleteReviewCommandHandler(IBookingRepository bookingRepository, IApplicationDbContext context)
    {
        _bookingRepository = bookingRepository;
        _context = context;
    }

    public async Task<Result> Handle(DeleteReviewCommand request, CancellationToken cancellationToken)
    {
        var booking = await _bookingRepository.GetWithDetailsAsync(request.BookingId, cancellationToken);
        if (booking == null)
            return Result.Failure("Booking not found");

        if (booking.UserId != request.UserId)
            return Result.Failure("You can only delete reviews for your own bookings");

        var review = await _context.Reviews
            .FirstOrDefaultAsync(item => item.BookingId == request.BookingId, cancellationToken);

        if (review == null)
            return Result.Failure("Review not found");

        var pitchId = review.PitchId;
        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync(cancellationToken);

        await ReviewRatingService.RecalculatePitchRatingAsync(_context, pitchId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
