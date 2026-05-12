namespace Application.Common.DTOs;

public record PitchServiceRequest(
    string Name,
    decimal Price,
    string Icon
);
