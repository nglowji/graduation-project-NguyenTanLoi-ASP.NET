namespace Api.Contracts;

public record NotificationResponse(
    Guid Id,
    string Type,
    string Title,
    string Message,
    bool IsRead,
    string CreatedAt
);
