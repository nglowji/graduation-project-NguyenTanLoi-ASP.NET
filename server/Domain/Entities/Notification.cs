using Domain.Common;
using Domain.Enums;
using Domain.Exceptions;

namespace Domain.Entities;

public class Notification : BaseEntity
{
    private const int MaxTitleLength = 200;
    private const int MaxMessageLength = 1000;

    private Notification() { } // EF Core constructor

    private Notification(Guid userId, NotificationType type, string title, string message)
    {
        UserId = userId;
        Type = type;
        Title = title;
        Message = message;
        IsRead = false;
    }

    public Guid UserId { get; private set; }
    public NotificationType Type { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public bool IsRead { get; private set; }
    public DateTime? ReadAt { get; private set; }

    public static Notification Create(Guid userId, NotificationType type, string title, string message)
    {
        ValidateCreationParameters(userId, title, message);
        return new Notification(userId, type, title, message);
    }

    public void MarkAsRead()
    {
        if (IsRead)
            return;

        IsRead = true;
        ReadAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public void MarkAsUnread()
    {
        if (!IsRead)
            return;

        IsRead = false;
        ReadAt = null;
        MarkAsUpdated();
    }

    private static void ValidateCreationParameters(Guid userId, string title, string message)
    {
        if (userId == Guid.Empty)
            throw new DomainException("User ID is required");

        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("Title is required");

        if (title.Length > MaxTitleLength)
            throw new DomainException($"Title cannot exceed {MaxTitleLength} characters");

        if (string.IsNullOrWhiteSpace(message))
            throw new DomainException("Message is required");

        if (message.Length > MaxMessageLength)
            throw new DomainException($"Message cannot exceed {MaxMessageLength} characters");
    }
}
