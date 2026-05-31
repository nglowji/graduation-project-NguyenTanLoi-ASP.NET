using Application.Common.DTOs;
using Application.Common.Interfaces;
using Application.Features.Reviews;
using Domain.Enums;
using MediatR;

namespace Application.Features.Reviews.Commands.UpdateReview;

public class UpdateReviewCommandHandler : IRequestHandler<UpdateReviewCommand, Result>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IReviewRepository _reviewRepository;
    private readonly IApplicationDbContext _context;

    public UpdateReviewCommandHandler(
        IBookingRepository bookingRepository,
        IReviewRepository reviewRepository,
        IApplicationDbContext context)
    {
        _bookingRepository = bookingRepository;
        _reviewRepository = reviewRepository;
        _context = context;
    }

    public async Task<Result> Handle(UpdateReviewCommand request, CancellationToken cancellationToken)
    {
        var booking = await _bookingRepository.GetWithDetailsAsync(request.BookingId, cancellationToken);
        if (booking == null)
            return Result.Failure("Booking not found");

        if (booking.UserId != request.UserId)
            return Result.Failure("You can only update reviews for your own bookings");

        if (booking.Status != BookingStatus.Completed)
            return Result.Failure("You can only review completed bookings");

        var review = await _reviewRepository.GetTrackedByBookingIdAsync(request.BookingId, cancellationToken);
        if (review == null)
            return Result.Failure("Review not found");

        review.Update(request.Rating, request.Comment);
        await ReviewRatingService.RecalculatePitchRatingAsync(_context, review.PitchId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
