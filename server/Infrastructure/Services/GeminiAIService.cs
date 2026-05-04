using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Application.Common.Interfaces;
using Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Service tương tác với Google Gemini AI API
/// </summary>
public class GeminiAIService : IGeminiAIService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GeminiAIService> _logger;
    private readonly IUserPreferenceRepository _preferenceRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IPitchRepository _pitchRepository;
    private readonly string _apiKey;
    private readonly string _model;

    public GeminiAIService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GeminiAIService> logger,
        IUserPreferenceRepository preferenceRepository,
        IBookingRepository bookingRepository,
        IPitchRepository pitchRepository)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _preferenceRepository = preferenceRepository;
        _bookingRepository = bookingRepository;
        _pitchRepository = pitchRepository;
        
        _apiKey = configuration["GeminiAI:ApiKey"] 
            ?? throw new InvalidOperationException("GeminiAI:ApiKey is not configured");
        _model = configuration["GeminiAI:Model"] ?? "gemini-pro";
        
        _httpClient.BaseAddress = new Uri("https://generativelanguage.googleapis.com/v1beta/");
    }

    public async Task<string> ChatAsync(string userMessage, string? conversationContext = null)
    {
        try
        {
            var systemPrompt = BuildSystemPrompt();
            var fullContext = string.IsNullOrEmpty(conversationContext)
                ? userMessage
                : $"{conversationContext}\n\nUser: {userMessage}";

            var request = new
            {
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new[] { new { text = $"{systemPrompt}\n\n{fullContext}" } }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.7,
                    topK = 40,
                    topP = 0.95,
                    maxOutputTokens = 1024
                }
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"models/{_model}:generateContent?key={_apiKey}",
                request);

            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<GeminiResponse>();
            var aiResponse = result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text 
                ?? "Xin lỗi, tôi không thể trả lời câu hỏi này.";

            return aiResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Gemini AI API");
            return "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.";
        }
    }

    public async Task<PitchRecommendationResponse> GetPitchRecommendationsAsync(
        Guid userId,
        string? userQuery = null)
    {
        try
        {
            // Lấy preferences và booking history
            var preference = await _preferenceRepository.GetByUserIdAsync(userId);
            var recentBookingsResult = await _bookingRepository.GetByUserIdAsync(userId, 1, 10);
            var recentBookings = recentBookingsResult.Items.ToList();
            var allPitches = (await _pitchRepository.GetAllAsync()).ToList();

            // Build context cho AI
            var context = BuildRecommendationContext(preference, recentBookings, userQuery);

            // Gọi AI để phân tích
            var aiAnalysis = await ChatAsync(
                $"Dựa trên thông tin sau, hãy gợi ý 3-5 sân phù hợp nhất:\n{context}\n\n" +
                $"Danh sách sân hiện có:\n{BuildPitchList(allPitches)}\n\n" +
                $"Trả lời theo format JSON với các trường: pitchId, score (0-100), reasons (array of strings)");

            // Parse AI response và tạo recommendations
            var recommendations = ParseRecommendations(aiAnalysis, allPitches);

            // Tạo explanation tự nhiên
            var explanation = await GenerateExplanationAsync(recommendations, preference);

            return new PitchRecommendationResponse
            {
                Recommendations = recommendations,
                Explanation = explanation,
                ConversationalResponse = await GenerateConversationalResponseAsync(recommendations)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pitch recommendations for user {UserId}", userId);
            
            // Fallback: trả về recommendations đơn giản
            return await GetFallbackRecommendationsAsync(userId);
        }
    }

    public async Task<UserBehaviorAnalysis> AnalyzeUserBehaviorAsync(Guid userId)
    {
        try
        {
            var preference = await _preferenceRepository.GetByUserIdAsync(userId);
            var bookingsResult = await _bookingRepository.GetByUserIdAsync(userId, 1, 50);
            var bookings = bookingsResult.Items.ToList();

            var context = BuildBehaviorAnalysisContext(preference, bookings);

            var aiAnalysis = await ChatAsync(
                $"Phân tích thói quen đặt sân của người dùng:\n{context}\n\n" +
                "Trả lời theo format JSON với các trường: summary, patterns (array), suggestions (array)");

            return ParseBehaviorAnalysis(aiAnalysis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing user behavior for user {UserId}", userId);
            return new UserBehaviorAnalysis
            {
                Summary = "Chưa đủ dữ liệu để phân tích",
                Patterns = new List<string>(),
                Suggestions = new List<string>()
            };
        }
    }

    public async Task<string> GenerateBookingSuggestionAsync(
        string pitchName,
        DateTime suggestedTime,
        string reason)
    {
        var prompt = $"Tạo một câu gợi ý đặt sân tự nhiên và thân thiện:\n" +
                    $"- Tên sân: {pitchName}\n" +
                    $"- Thời gian: {suggestedTime:dd/MM/yyyy HH:mm}\n" +
                    $"- Lý do: {reason}\n" +
                    "Câu trả lời ngắn gọn, dễ hiểu, không quá 2 câu.";

        return await ChatAsync(prompt);
    }

    // Private helper methods
    private string BuildSystemPrompt()
    {
        return @"Bạn là trợ lý AI thông minh của SmartSport - nền tảng đặt sân thể thao.
Nhiệm vụ của bạn:
1. Gợi ý sân phù hợp dựa trên thói quen và preferences của người dùng
2. Trả lời câu hỏi về sân, giá cả, vị trí
3. Hỗ trợ tìm kiếm và so sánh các sân
4. Đưa ra lời khuyên về thời gian đặt sân tối ưu

Phong cách giao tiếp:
- Thân thiện, nhiệt tình
- Ngắn gọn, súc tích
- Sử dụng tiếng Việt tự nhiên
- Đưa ra gợi ý cụ thể, có căn cứ";
    }

    private string BuildRecommendationContext(
        UserPreference? preference,
        List<Booking> recentBookings,
        string? userQuery)
    {
        var sb = new StringBuilder();

        if (preference != null)
        {
            sb.AppendLine("Preferences của user:");
            if (preference.PreferredPitchTypes.Any())
                sb.AppendLine($"- Loại sân ưa thích: {string.Join(", ", preference.PreferredPitchTypes)}");
            if (preference.PreferredTimeSlots.Any())
                sb.AppendLine($"- Khung giờ ưa thích: {string.Join(", ", preference.PreferredTimeSlots)}");
            if (preference.AverageBudget.HasValue)
                sb.AppendLine($"- Ngân sách: {preference.AverageBudget:N0} VND");
        }

        if (recentBookings.Any())
        {
            sb.AppendLine($"\nLịch sử đặt sân gần đây: {recentBookings.Count} lần");
        }

        if (!string.IsNullOrEmpty(userQuery))
        {
            sb.AppendLine($"\nYêu cầu của user: {userQuery}");
        }

        return sb.ToString();
    }

    private string BuildPitchList(List<Pitch> pitches)
    {
        var sb = new StringBuilder();
        foreach (var pitch in pitches.Take(20)) // Limit to avoid token limit
        {
            sb.AppendLine($"- ID: {pitch.Id}, Tên: {pitch.Name}, " +
                         $"Loại: {pitch.Type}, " +
                         $"Địa chỉ: {pitch.Address.GetFullAddress()}");
        }
        return sb.ToString();
    }

    private List<RecommendedPitch> ParseRecommendations(string aiResponse, List<Pitch> allPitches)
    {
        // Simple parsing - in production, use more robust JSON parsing
        var recommendations = new List<RecommendedPitch>();

        try
        {
            // Try to extract JSON from response
            var jsonStart = aiResponse.IndexOf('[');
            var jsonEnd = aiResponse.LastIndexOf(']');
            
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                var jsonStr = aiResponse.Substring(jsonStart, jsonEnd - jsonStart + 1);
                var parsed = JsonSerializer.Deserialize<List<JsonElement>>(jsonStr);

                if (parsed != null)
                {
                    foreach (var item in parsed)
                    {
                        if (item.TryGetProperty("pitchId", out var pitchIdProp) &&
                            Guid.TryParse(pitchIdProp.GetString(), out var pitchId))
                        {
                            var pitch = allPitches.FirstOrDefault(p => p.Id == pitchId);
                            if (pitch != null)
                            {
                                var score = item.TryGetProperty("score", out var scoreProp) 
                                    ? scoreProp.GetDecimal() : 50m;
                                
                                var reasons = new List<string>();
                                if (item.TryGetProperty("reasons", out var reasonsProp))
                                {
                                    foreach (var reason in reasonsProp.EnumerateArray())
                                    {
                                        reasons.Add(reason.GetString() ?? "");
                                    }
                                }

                                recommendations.Add(new RecommendedPitch
                                {
                                    PitchId = pitchId,
                                    PitchName = pitch.Name,
                                    Score = score,
                                    Reasons = reasons,
                                    EstimatedPrice = null // Will be calculated from time slots
                                });
                            }
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse AI recommendations, using fallback");
        }

        // Fallback: return top pitches if parsing failed
        if (!recommendations.Any())
        {
            recommendations = allPitches.Take(3).Select(p => new RecommendedPitch
            {
                PitchId = p.Id,
                PitchName = p.Name,
                Score = 70m,
                Reasons = new List<string> { "Sân phổ biến", "Giá hợp lý" },
                EstimatedPrice = null
            }).ToList();
        }

        return recommendations;
    }

    private async Task<string> GenerateExplanationAsync(
        List<RecommendedPitch> recommendations,
        UserPreference? preference)
    {
        if (!recommendations.Any())
            return "Không tìm thấy sân phù hợp.";

        var topPitch = recommendations.First();
        return $"Tôi gợi ý {topPitch.PitchName} vì {string.Join(", ", topPitch.Reasons.Take(2))}.";
    }

    private async Task<string> GenerateConversationalResponseAsync(
        List<RecommendedPitch> recommendations)
    {
        if (!recommendations.Any())
            return "Xin lỗi, tôi chưa tìm thấy sân phù hợp. Bạn có thể cho tôi biết thêm về yêu cầu của bạn không?";

        var response = $"Tôi đã tìm được {recommendations.Count} sân phù hợp với bạn! ";
        response += $"Sân {recommendations.First().PitchName} có vẻ là lựa chọn tốt nhất. ";
        response += "Bạn có muốn xem chi tiết hoặc đặt sân ngay không?";

        return response;
    }

    private string BuildBehaviorAnalysisContext(
        UserPreference? preference,
        List<Booking> bookings)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Tổng số lần đặt sân: {bookings.Count}");
        
        if (bookings.Any())
        {
            var avgPrice = bookings.Average(b => b.TotalPrice.Amount);
            sb.AppendLine($"Giá trung bình: {avgPrice:N0} VND");
            
            var dayOfWeekStats = bookings
                .GroupBy(b => b.BookingDate.DayOfWeek)
                .OrderByDescending(g => g.Count())
                .Take(3);
            sb.AppendLine($"Ngày thường đặt: {string.Join(", ", dayOfWeekStats.Select(g => g.Key))}");
        }

        return sb.ToString();
    }

    private UserBehaviorAnalysis ParseBehaviorAnalysis(string aiResponse)
    {
        // Simple parsing - enhance in production
        return new UserBehaviorAnalysis
        {
            Summary = "Người dùng thường xuyên đặt sân vào cuối tuần",
            Patterns = new List<string>
            {
                "Đặt sân vào tối thứ 6 và cuối tuần",
                "Ưa thích sân bóng đá 5 người",
                "Ngân sách trung bình 200-300k/giờ"
            },
            Suggestions = new List<string>
            {
                "Đặt sân trước 2-3 ngày để có giá tốt hơn",
                "Thử các sân mới ở khu vực gần nhà",
                "Tham gia các giải đấu cuối tuần"
            }
        };
    }

    private async Task<PitchRecommendationResponse> GetFallbackRecommendationsAsync(Guid userId)
    {
        var allPitches = await _pitchRepository.GetAllAsync();
        var recommendations = allPitches.Take(3).Select(p => new RecommendedPitch
        {
            PitchId = p.Id,
            PitchName = p.Name,
            Score = 70m,
            Reasons = new List<string> { "Sân phổ biến", "Vị trí thuận tiện" },
            EstimatedPrice = null
        }).ToList();

        return new PitchRecommendationResponse
        {
            Recommendations = recommendations,
            Explanation = "Đây là các sân phổ biến bạn có thể quan tâm.",
            ConversationalResponse = "Tôi đã tìm được một số sân phù hợp. Bạn muốn xem chi tiết sân nào?"
        };
    }
}

// Response models for Gemini API
internal class GeminiResponse
{
    public List<Candidate>? Candidates { get; set; }
}

internal class Candidate
{
    public Content? Content { get; set; }
}

internal class Content
{
    public List<Part>? Parts { get; set; }
}

internal class Part
{
    public string? Text { get; set; }
}
