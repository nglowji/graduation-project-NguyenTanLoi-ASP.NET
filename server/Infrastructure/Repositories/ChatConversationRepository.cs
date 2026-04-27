using Application.Common.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class ChatConversationRepository : IChatConversationRepository
{
    private readonly ApplicationDbContext _context;

    public ChatConversationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ChatConversation?> GetBySessionIdAsync(
        string sessionId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<ChatConversation>()
            .FirstOrDefaultAsync(c => c.SessionId == sessionId, cancellationToken);
    }

    public async Task<List<ChatConversation>> GetUserConversationsAsync(
        Guid userId,
        int limit = 10,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<ChatConversation>()
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.LastMessageAt)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<ChatConversation> CreateAsync(
        ChatConversation conversation,
        CancellationToken cancellationToken = default)
    {
        await _context.Set<ChatConversation>().AddAsync(conversation, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return conversation;
    }

    public async Task UpdateAsync(
        ChatConversation conversation,
        CancellationToken cancellationToken = default)
    {
        _context.Set<ChatConversation>().Update(conversation);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
