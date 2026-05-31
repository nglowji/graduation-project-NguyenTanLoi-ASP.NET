using Application.Common.DTOs;
using Application.Common.Interfaces;
using Application.Features.Reviews.DTOs;
using MediatR;

namespace Application.Features.Reviews.Queries.GetBookingReview;

public class GetBookingReviewQueryHandler : IRequestHandler<GetBookingReviewQuery, Result<ReviewDto>>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IReviewRepository _reviewRepository;

    public GetBookingReviewQueryHandler(IBookingRepository bookingRepository, IReviewRepository reviewRepository)
    {
        _bookingRepository = bookingRepository;
        _reviewRepository = reviewRepository;
    }

    public async Task<Result<ReviewDto>> Handle(GetBookingReviewQuery request, CancellationToken cancellationToken)
    {
        var booking = await _bookingRepository.GetWithDetailsAsync(request.BookingId, cancellationToken);
        if (booking == null)
            return Result<ReviewDto>.Failure("Booking not found");

        if (booking.UserId != request.UserId)
            return Result<ReviewDto>.Failure("You can only view reviews for your own bookings");

        var review = await _reviewRepository.GetByBookingIdAsync(request.BookingId, cancellationToken);
        if (review == null)
            return Result<ReviewDto>.Failure("Review not found");

        return Result<ReviewDto>.Success(new ReviewDto
        {
            Id = review.Id,
            UserId = review.UserId,
            UserFullName = review.User.FullName,
            PitchId = review.PitchId,
            BookingId = review.BookingId,
            Rating = review.Rating,
            Comment = review.Comment,
            OwnerReply = review.OwnerReply,
            CreatedAt = review.CreatedAt
        });
    }
}
