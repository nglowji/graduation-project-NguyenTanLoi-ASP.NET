using System.Globalization;
using System.Text;
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

    public ChatWithAICommandHandler(
        IGeminiAIService geminiService,
        IChatConversationRepository conversationRepository,
        IUserPreferenceRepository preferenceRepository,
        IBookingRepository bookingRepository)
    {
        _geminiService = geminiService;
        _conversationRepository = conversationRepository;
    }

    public async Task<ChatWithAIResponse> Handle(ChatWithAICommand request, CancellationToken cancellationToken)
    {
        var sessionId = request.SessionId ?? Guid.NewGuid().ToString();
        var conversation = await _conversationRepository.GetBySessionIdAsync(sessionId, cancellationToken);

        if (conversation == null)
        {
            conversation = Domain.Entities.ChatConversation.Create(request.UserId, sessionId);
            await _conversationRepository.CreateAsync(conversation, cancellationToken);
        }

        conversation.AddMessage("user", request.Message);

        var context = BuildConversationContext(conversation);
        var aiResponse = await _geminiService.ChatAsync(request.Message, context);

        List<RecommendedPitch>? recommendations = null;
        if (IsAskingForRecommendations(request.Message))
        {
            var recommendationResponse = await _geminiService.GetPitchRecommendationsAsync(
                request.UserId,
                request.Message);

            recommendations = recommendationResponse.Recommendations;

            if (recommendations.Any())
            {
                aiResponse = $"{aiResponse}\n\n{recommendationResponse.ConversationalResponse}";
            }
        }

        conversation.AddMessage("assistant", aiResponse);
        await _conversationRepository.UpdateAsync(conversation, cancellationToken);

        return new ChatWithAIResponse
        {
            SessionId = sessionId,
            Response = aiResponse,
            Recommendations = recommendations,
            Timestamp = DateTime.UtcNow
        };
    }

    private static string BuildConversationContext(Domain.Entities.ChatConversation conversation)
    {
        var recentMessages = conversation.Messages
            .TakeLast(10)
            .Select(m => $"{m.Role}: {m.Content}")
            .ToList();

        return string.Join("\n", recentMessages);
    }

    private static bool IsAskingForRecommendations(string message)
    {
        var normalized = RemoveDiacritics(message).ToLowerInvariant();
        var keywords = new[]
        {
            "goi y", "recommend", "de xuat", "tu van",
            "tim san", "san nao", "san gan", "san phu hop",
            "dat san", "book", "booking", "choi o dau",
            "bong da", "cau long", "tennis", "pickleball", "bong ro", "bong chuyen"
        };

        return keywords.Any(normalized.Contains);
    }

    private static string RemoveDiacritics(string text)
    {
        var normalized = text.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }
}
