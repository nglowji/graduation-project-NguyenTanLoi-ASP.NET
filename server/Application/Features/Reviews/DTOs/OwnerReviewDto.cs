namespace Application.Features.Reviews.DTOs;

public record OwnerReviewDto(
    Guid Id,
    string UserName,
    Guid PitchId,
    string PitchName,
    string PitchType,
    int Rating,
    string? Comment,
    string? Reply,
    DateTime CreatedAt
);
