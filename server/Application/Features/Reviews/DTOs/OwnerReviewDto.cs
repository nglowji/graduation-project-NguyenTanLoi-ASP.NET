namespace Application.Features.Reviews.DTOs;

public record OwnerReviewDto(
    Guid Id,
    string UserName,
    string PitchName,
    int Rating,
    string? Comment,
    string? Reply,
    DateTime CreatedAt
);
