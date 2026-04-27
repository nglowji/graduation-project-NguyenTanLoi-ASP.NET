using Domain.Common;

namespace Domain.Entities;

/// <summary>
/// Lưu trữ lịch sử chat với AI để maintain context
/// </summary>
public class ChatConversation : BaseEntity
{
    private ChatConversation() { } // EF Core

    private ChatConversation(Guid userId, string sessionId)
    {
        UserId = userId;
        SessionId = sessionId;
        Messages = new List<ChatMessage>();
    }

    public Guid UserId { get; private set; }
    public string SessionId { get; private set; } = null!;
    public List<ChatMessage> Messages { get; private set; } = new();
    public DateTime? LastMessageAt { get; private set; }
    public bool IsActive { get; private set; } = true;

    public static ChatConversation Create(Guid userId, string sessionId)
    {
        return new ChatConversation(userId, sessionId);
    }

    public void AddMessage(string role, string content)
    {
        Messages.Add(new ChatMessage
        {
            Role = role,
            Content = content,
            Timestamp = DateTime.UtcNow
        });
        LastMessageAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public void EndSession()
    {
        IsActive = false;
        MarkAsUpdated();
    }
}

public class ChatMessage
{
    public string Role { get; set; } = null!; // "user" or "assistant"
    public string Content { get; set; } = null!;
    public DateTime Timestamp { get; set; }
}
