namespace Application.Features.Reviews.DTOs;

public record OwnerReviewDto(
    Guid Id,
    string UserName,
    Guid PitchId,
    string PitchName,
    int Rating,
    string? Comment,
    string? Reply,
    DateTime CreatedAt
);
