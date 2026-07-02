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
        var pitch = await context.Pitches
            .AsTracking()
            .FirstOrDefaultAsync(p => p.Id == pitchId, cancellationToken);
        if (pitch == null)
            return;

        var stats = await context.Reviews
            .AsNoTracking()
            .Where(review => review.PitchId == pitchId)
            .GroupBy(review => review.PitchId)
            .Select(g => new
            {
                Count = g.Count(),
                Average = g.Average(review => (decimal)review.Rating)
            })
            .FirstOrDefaultAsync(cancellationToken);

        var totalReviews = stats?.Count ?? 0;
        var averageRating = stats?.Average ?? 0m;

        pitch.SetRatingSnapshot(averageRating, totalReviews);
    }
}
