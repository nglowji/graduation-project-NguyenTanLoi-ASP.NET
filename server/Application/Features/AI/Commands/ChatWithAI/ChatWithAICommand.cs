using Application.Common.Interfaces;
using MediatR;

namespace Application.Features.AI.Commands.ChatWithAI;

public record ChatWithAICommand : IRequest<ChatWithAIResponse>
{
    public Guid UserId { get; init; }
    public string Message { get; init; } = null!;
    public string? SessionId { get; init; }
}

public class ChatWithAIResponse
{
    public string SessionId { get; set; } = null!;
    public string Response { get; set; } = null!;
    public List<RecommendedPitch>? Recommendations { get; set; }
    public DateTime Timestamp { get; set; }
}

public class ChatWithAICommandHandler : IRequestHandler<ChatWithAICommand, ChatWithAIResponse>
{
    private readonly IGeminiAIService _geminiService;
    private readonly IChatConversationRepository _conversationRepository;
    private readonly IUserPreferenceRepository _preferenceRepository;
    private readonly IBookingRepository _bookingRepository;

    public ChatWithAICommandHandler(
        IGeminiAIService geminiService,
        IChatConversationRepository conversationRepository,
        IUserPreferenceRepository preferenceRepository,
        IBookingRepository bookingRepository)
    {
        _geminiService = geminiService;
        _conversationRepository = conversationRepository;
        _preferenceRepository = preferenceRepository;
        _bookingRepository = bookingRepository;
    }

    public async Task<ChatWithAIResponse> Handle(ChatWithAICommand request, CancellationToken cancellationToken)
    {
        // Get or create conversation
        var sessionId = request.SessionId ?? Guid.NewGuid().ToString();
        var conversation = await _conversationRepository.GetBySessionIdAsync(sessionId, cancellationToken);

        if (conversation == null)
        {
            conversation = Domain.Entities.ChatConversation.Create(request.UserId, sessionId);
            await _conversationRepository.CreateAsync(conversation, cancellationToken);
        }

        // Add user message
        conversation.AddMessage("user", request.Message);

        // Build context from conversation history
        var context = BuildConversationContext(conversation);

        // Get AI response
        var aiResponse = await _geminiService.ChatAsync(request.Message, context);

        // Add AI response to conversation
        conversation.AddMessage("assistant", aiResponse);
        await _conversationRepository.UpdateAsync(conversation, cancellationToken);

        // Check if user is asking for recommendations
        List<RecommendedPitch>? recommendations = null;
        if (IsAskingForRecommendations(request.Message))
        {
            var recommendationResponse = await _geminiService.GetPitchRecommendationsAsync(
                request.UserId,
                request.Message);
            recommendations = recommendationResponse.Recommendations;
        }

        return new ChatWithAIResponse
        {
            SessionId = sessionId,
            Response = aiResponse,
            Recommendations = recommendations,
            Timestamp = DateTime.UtcNow
        };
    }

    private string BuildConversationContext(Domain.Entities.ChatConversation conversation)
    {
        var recentMessages = conversation.Messages
            .TakeLast(10)
            .Select(m => $"{m.Role}: {m.Content}")
            .ToList();

        return string.Join("\n", recentMessages);
    }

    private bool IsAskingForRecommendations(string message)
    {
        var keywords = new[] { "gợi ý", "recommend", "tìm sân", "find pitch", "đặt sân", "book" };
        return keywords.Any(k => message.ToLower().Contains(k));
    }
}
