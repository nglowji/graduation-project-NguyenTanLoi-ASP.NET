using Application.Features.Pitches.DTOs;
using MediatR;
using Application.Common.Models;

namespace Application.Features.Recommendations.Queries;

public record GetPersonalizedRecommendationsQuery(Guid UserId, int Limit = 5) : IRequest<Result<List<PitchDto>>>;
