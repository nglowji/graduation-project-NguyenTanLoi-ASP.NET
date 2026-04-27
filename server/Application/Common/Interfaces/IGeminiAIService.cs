namespace Application.Common.Interfaces;

/// <summary>
/// Service để tương tác với Gemini AI
/// </summary>
public interface IGeminiAIService
{
    /// <summary>
    /// Chat với AI và nhận gợi ý
    /// </summary>
    Task<string> ChatAsync(string userMessage, string? conversationContext = null);

    /// <summary>
    /// Gợi ý sân dựa trên preferences và context
    /// </summary>
    Task<PitchRecommendationResponse> GetPitchRecommendationsAsync(
        Guid userId,
        string? userQuery = null);

    /// <summary>
    /// Phân tích thói quen người dùng
    /// </summary>
    Task<UserBehaviorAnalysis> AnalyzeUserBehaviorAsync(Guid userId);

    /// <summary>
    /// Tạo câu trả lời tự nhiên cho booking suggestions
    /// </summary>
    Task<string> GenerateBookingSuggestionAsync(
        string pitchName,
        DateTime suggestedTime,
        string reason);
}

public class PitchRecommendationResponse
{
    public List<RecommendedPitch> Recommendations { get; set; } = new();
    public string Explanation { get; set; } = null!;
    public string ConversationalResponse { get; set; } = null!;
}

public class RecommendedPitch
{
    public Guid PitchId { get; set; }
    public string PitchName { get; set; } = null!;
    public decimal Score { get; set; } // 0-100
    public List<string> Reasons { get; set; } = new();
    public decimal? EstimatedPrice { get; set; }
    public double? DistanceKm { get; set; }
}

public class UserBehaviorAnalysis
{
    public string Summary { get; set; } = null!;
    public List<string> Patterns { get; set; } = new();
    public List<string> Suggestions { get; set; } = new();
}
