using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Reviews.Commands.CreateReview;

public class CreateReviewCommandHandler : IRequestHandler<CreateReviewCommand, Result<Guid>>
{
    private readonly IReviewRepository _reviewRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CreateReviewCommandHandler> _logger;

    public CreateReviewCommandHandler(
        IReviewRepository reviewRepository,
        IBookingRepository bookingRepository,
        IApplicationDbContext context,
        ILogger<CreateReviewCommandHandler> logger)
    {
        _reviewRepository = reviewRepository;
        _bookingRepository = bookingRepository;
        _context = context;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(CreateReviewCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // 1. Get booking with details
            var booking = await _bookingRepository.GetWithDetailsAsync(request.BookingId, cancellationToken);
            if (booking == null)
                return Result<Guid>.Failure("Booking not found");

            // 2. Security check: User must own the booking
            if (booking.UserId != request.UserId)
                return Result<Guid>.Failure("You can only review your own bookings");

            // 3. Status check: Only completed bookings can be reviewed
            if (booking.Status != BookingStatus.Completed)
                return Result<Guid>.Failure("You can only review completed bookings");

            // 4. One review per booking check
            var hasReviewed = await _reviewRepository.HasUserReviewedBookingAsync(request.BookingId, cancellationToken);
            if (hasReviewed)
                return Result<Guid>.Failure("You have already reviewed this booking");

            // 5. Create review
            var review = Review.Create(
                request.UserId,
                booking.TimeSlot.PitchId,
                request.BookingId,
                request.Rating,
                request.Comment
            );

            await _reviewRepository.AddAsync(review, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Review {ReviewId} created for booking {BookingId}", review.Id, request.BookingId);

            return Result<Guid>.Success(review.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating review for booking {BookingId}", request.BookingId);
            return Result<Guid>.Failure("An error occurred while creating your review");
        }
    }
}
