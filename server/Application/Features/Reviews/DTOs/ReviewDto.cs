namespace Application.Features.Reviews.DTOs;

public record ReviewDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string UserFullName { get; init; } = string.Empty;
    public Guid PitchId { get; init; }
    public Guid BookingId { get; init; }
    public int Rating { get; init; }
    public string? Comment { get; init; }
    public DateTime CreatedAt { get; init; }
}
