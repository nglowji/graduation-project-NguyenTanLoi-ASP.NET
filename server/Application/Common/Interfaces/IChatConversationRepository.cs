using Domain.Entities;

namespace Application.Common.Interfaces;

public interface IChatConversationRepository
{
    Task<ChatConversation?> GetBySessionIdAsync(string sessionId, CancellationToken cancellationToken = default);
    Task<List<ChatConversation>> GetUserConversationsAsync(Guid userId, int limit = 10, CancellationToken cancellationToken = default);
    Task<ChatConversation> CreateAsync(ChatConversation conversation, CancellationToken cancellationToken = default);
    Task UpdateAsync(ChatConversation conversation, CancellationToken cancellationToken = default);
}
