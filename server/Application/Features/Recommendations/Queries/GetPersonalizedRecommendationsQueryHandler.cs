using Application.Common.Interfaces;
using Application.Common.Models;
using Application.Features.Pitches.DTOs;
using AutoMapper;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Recommendations.Queries;

public class GetPersonalizedRecommendationsQueryHandler : IRequestHandler<GetPersonalizedRecommendationsQuery, Result<List<PitchDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetPersonalizedRecommendationsQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<PitchDto>>> Handle(GetPersonalizedRecommendationsQuery request, CancellationToken cancellationToken)
    {
        // 1. Get User's Booking History (limit to last 20 bookings for analysis)
        var history = await _context.Bookings
            .Include(b => b.TimeSlot)
                .ThenInclude(ts => ts.Pitch)
            .Where(b => b.UserId == request.UserId && b.Status != BookingStatus.Cancelled)
            .OrderByDescending(b => b.CreatedAt)
            .Take(20)
            .ToListAsync(cancellationToken);

        if (!history.Any())
        {
            // If no history, return top rated pitches as fallback
            var topPitches = await _context.Pitches
                .Where(p => p.Status == PitchStatus.Active)
                .OrderByDescending(p => p.AverageRating)
                .Take(request.Limit)
                .ToListAsync(cancellationToken);
            
            return Result<List<PitchDto>>.Success(_mapper.Map<List<PitchDto>>(topPitches));
        }

        // 2. Analyze Favorites
        var favoriteType = history
            .GroupBy(b => b.TimeSlot.Pitch.Type)
            .OrderByDescending(g => g.Count())
            .First().Key;

        var favoriteTimeRanges = history
            .GroupBy(b => b.TimeSlot.TimeRange)
            .OrderByDescending(g => g.Count())
            .Take(2)
            .Select(g => g.Key)
            .ToList();

        var playedPitchIds = history.Select(b => b.TimeSlot.PitchId).Distinct().ToList();

        // 3. Query Recommendations
        // - Same type as favorite
        // - High rating
        // - Not necessarily played before (discovery) or played often (loyalty)
        var recommendations = await _context.Pitches
            .Where(p => p.Status == PitchStatus.Active && p.Type == favoriteType)
            .OrderByDescending(p => p.AverageRating)
            .ThenBy(p => playedPitchIds.Contains(p.Id) ? 0 : 1) // Prioritize discovery slightly if ratings are equal
            .Take(request.Limit)
            .ToListAsync(cancellationToken);

        return Result<List<PitchDto>>.Success(_mapper.Map<List<PitchDto>>(recommendations));
    }
}
