namespace Application.Common.DTOs;

public record PitchTimeSlotRequest(
    TimeSpan StartTime,
    TimeSpan EndTime,
    decimal Price
);
