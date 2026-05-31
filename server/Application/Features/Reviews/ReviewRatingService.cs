using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Reviews;

internal static class ReviewRatingService
{
    public static async Task RecalculatePitchRatingAsync(
        IApplicationDbContext context,
        Guid pitchId,
        CancellationToken cancellationToken)
    {
        var pitch = await context.Pitches.FirstOrDefaultAsync(p => p.Id == pitchId, cancellationToken);
        if (pitch == null)
            return;

        var ratings = await context.Reviews
            .Where(review => review.PitchId == pitchId)
            .Select(review => review.Rating)
            .ToListAsync(cancellationToken);

        var totalReviews = ratings.Count;
        var averageRating = totalReviews == 0 ? 0m : (decimal)ratings.Average();

        pitch.SetRatingSnapshot(averageRating, totalReviews);
    }
}
