using Application.Common.DTOs;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Reviews.Commands.ReplyReview;

public class ReplyReviewCommandHandler : IRequestHandler<ReplyReviewCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly IUserRepository _userRepository;

    public ReplyReviewCommandHandler(IApplicationDbContext context, IUserRepository userRepository)
    {
        _context = context;
        _userRepository = userRepository;
    }

    public async Task<Result> Handle(ReplyReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await _context.Reviews
            .Include(r => r.Pitch)
            .FirstOrDefaultAsync(r => r.Id == request.ReviewId, cancellationToken);

        if (review == null)
            return Result.Failure("Review not found");

        var requester = await _userRepository.GetByIdAsync(request.RequesterId, cancellationToken);
        if (requester == null)
            return Result.Failure("User not found");

        var pitchOwnerId = review.Pitch.OwnerId;
        var isAuthorized = requester.IsAdmin()
            || requester.Id == pitchOwnerId
            || (requester.IsPitchStaff() && requester.OwnerId == pitchOwnerId);

        if (!isAuthorized)
            return Result.Failure("You are not authorized to reply to this review");

        try
        {
            review.Reply(request.Content);
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Failure("Đánh giá này đã bị xóa hoặc thay đổi bởi người dùng khác.");
        }
        catch (Exception ex)
        {
            return Result.Failure($"Lỗi hệ thống khi phản hồi: {ex.Message}");
        }
    }
}
