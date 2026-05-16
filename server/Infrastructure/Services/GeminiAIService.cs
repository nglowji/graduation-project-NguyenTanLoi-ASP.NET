using System.Globalization;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Talks to Google Gemini and falls back to deterministic SmartSport answers when the AI API is unavailable.
/// </summary>
public class GeminiAIService : IGeminiAIService
{
    private readonly HttpClient _httpClient;
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
        _logger = logger;
        _preferenceRepository = preferenceRepository;
        _bookingRepository = bookingRepository;
        _pitchRepository = pitchRepository;
        _apiKey = configuration["GeminiAI:ApiKey"] ?? string.Empty;
        _model = configuration["GeminiAI:Model"] ?? "gemini-1.5-flash";

        _httpClient.BaseAddress = new Uri("https://generativelanguage.googleapis.com/v1beta/");
        _httpClient.Timeout = TimeSpan.FromSeconds(20);
    }

    public async Task<string> ChatAsync(string userMessage, string? conversationContext = null)
    {
        if (string.IsNullOrWhiteSpace(_apiKey) || _apiKey.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase))
        {
            return BuildOfflineChatAnswer(userMessage);
        }

        try
        {
            var fullContext = string.IsNullOrWhiteSpace(conversationContext)
                ? userMessage
                : $"{conversationContext}\n\nTin nhắn mới: {userMessage}";

            var request = new
            {
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new[] { new { text = $"{BuildSystemPrompt()}\n\n{fullContext}" } }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.75,
                    topK = 40,
                    topP = 0.95,
                    maxOutputTokens = 1200
                }
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"models/{_model}:generateContent?key={_apiKey}",
                request);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogWarning(
                    "Gemini AI API failed with status {StatusCode}. Body: {Body}",
                    response.StatusCode,
                    errorBody);

                return BuildOfflineChatAnswer(userMessage);
            }

            var result = await response.Content.ReadFromJsonAsync<GeminiResponse>();
            var aiResponse = result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;

            return string.IsNullOrWhiteSpace(aiResponse) || IsFailureMessage(aiResponse)
                ? BuildOfflineChatAnswer(userMessage)
                : aiResponse.Trim();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gemini AI API failed. Falling back to local assistant response.");
            return BuildOfflineChatAnswer(userMessage);
        }
    }

    public async Task<PitchRecommendationResponse> GetPitchRecommendationsAsync(
        Guid userId,
        string? userQuery = null)
    {
        try
        {
            var preference = await _preferenceRepository.GetByUserIdAsync(userId);
            var recentBookingsResult = await _bookingRepository.GetByUserIdAsync(userId, 1, 10);
            var recentBookings = recentBookingsResult.Items.ToList();
            var allPitches = (await _pitchRepository.GetAllAsync()).ToList();

            if (!allPitches.Any())
            {
                return EmptyRecommendationResponse();
            }

            var aiPrompt =
                "Hãy chọn 3-5 sân phù hợp nhất từ danh sách. Chỉ trả về JSON array, không markdown. " +
                "Mỗi item gồm pitchId, score từ 0 đến 100, reasons là mảng 1-3 lý do tiếng Việt.\n\n" +
                BuildRecommendationContext(preference, recentBookings, userQuery) +
                $"\nDanh sách sân:\n{BuildPitchList(allPitches)}";

            var aiAnalysis = await ChatAsync(aiPrompt);
            var recommendations = ParseRecommendations(aiAnalysis, allPitches);

            if (!recommendations.Any())
            {
                recommendations = BuildSmartFallbackRecommendations(allPitches, userQuery);
            }

            return new PitchRecommendationResponse
            {
                Recommendations = recommendations,
                Explanation = GenerateExplanation(recommendations),
                ConversationalResponse = GenerateConversationalResponse(recommendations)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pitch recommendations for user {UserId}", userId);
            return await GetFallbackRecommendationsAsync(userId, userQuery);
        }
    }

    public async Task<UserBehaviorAnalysis> AnalyzeUserBehaviorAsync(Guid userId)
    {
        try
        {
            var preference = await _preferenceRepository.GetByUserIdAsync(userId);
            var bookingsResult = await _bookingRepository.GetByUserIdAsync(userId, 1, 50);
            var bookings = bookingsResult.Items.ToList();

            if (!bookings.Any())
            {
                return new UserBehaviorAnalysis
                {
                    Summary = "Bạn chưa có đủ lịch sử đặt sân để phân tích thói quen.",
                    Patterns = new List<string>(),
                    Suggestions = new List<string>
                    {
                        "Hãy thử đặt 1-2 sân yêu thích để SmartSport học được khung giờ và ngân sách của bạn.",
                        "Bạn có thể hỏi trợ lý: gợi ý sân cầu lông dưới 150k gần Quận 1."
                    }
                };
            }

            var favoriteTypes = preference?.PreferredPitchTypes.Any() == true
                ? string.Join(", ", preference.PreferredPitchTypes)
                : "chưa xác định";

            return new UserBehaviorAnalysis
            {
                Summary = $"Bạn đã có {bookings.Count} lượt đặt gần đây. Môn/sân ưa thích: {favoriteTypes}.",
                Patterns = new List<string>
                {
                    $"Giá trung bình khoảng {bookings.Average(b => b.TotalPrice.Amount):N0} VND/lượt.",
                    $"Ngày đặt thường gặp: {bookings.GroupBy(b => b.BookingDate.DayOfWeek).OrderByDescending(g => g.Count()).First().Key}."
                },
                Suggestions = new List<string>
                {
                    "Đặt sân trước 1-3 ngày để có nhiều khung giờ đẹp hơn.",
                    "Nếu chơi sau giờ làm, hãy ưu tiên giữ chỗ trước 17:00."
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing user behavior for user {UserId}", userId);
            return new UserBehaviorAnalysis
            {
                Summary = "Chưa đủ dữ liệu để phân tích.",
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
        return await ChatAsync(
            $"Viết một gợi ý đặt sân ngắn, tự nhiên bằng tiếng Việt. Sân: {pitchName}. " +
            $"Thời gian: {suggestedTime:dd/MM/yyyy HH:mm}. Lý do: {reason}.");
    }

    private static string BuildSystemPrompt()
    {
        return """
Bạn là SmartSport AI, trợ lý đặt sân thể thao trong ứng dụng SmartSport.

Bạn có thể trả lời mọi câu hỏi thông thường của người dùng, nhưng ưu tiên hỗ trợ:
- Tìm sân theo môn, khu vực, ngân sách, khung giờ, sân trong nhà/ngoài trời.
- Giải thích quy trình đặt sân, đặt cọc 10%, thanh toán VNPAY, hủy đặt sân và check-in.
- So sánh lựa chọn, hỏi lại khi thiếu dữ kiện, và đưa ra bước tiếp theo rõ ràng.

Quy tắc trả lời:
- Luôn dùng tiếng Việt tự nhiên.
- Trả lời ngắn gọn nhưng đủ ý, thân thiện, không bịa dữ liệu cụ thể nếu hệ thống chưa cung cấp.
- Khi người dùng hỏi tìm sân, hãy tóm tắt tiêu chí và đề nghị xem các thẻ sân được gợi ý bên dưới.
- Nếu câu hỏi ngoài thể thao/đặt sân, vẫn trả lời hữu ích ở mức tổng quát, rồi kéo nhẹ về SmartSport nếu phù hợp.
""";
    }

    private string BuildRecommendationContext(
        UserPreference? preference,
        List<Booking> recentBookings,
        string? userQuery)
    {
        var sb = new StringBuilder();

        if (!string.IsNullOrWhiteSpace(userQuery))
        {
            sb.AppendLine($"Yêu cầu người dùng: {userQuery}");
        }

        if (preference != null)
        {
            if (preference.PreferredPitchTypes.Any())
                sb.AppendLine($"Loại sân ưa thích: {string.Join(", ", preference.PreferredPitchTypes)}");
            if (preference.PreferredTimeSlots.Any())
                sb.AppendLine($"Khung giờ ưa thích: {string.Join(", ", preference.PreferredTimeSlots)}");
            if (preference.AverageBudget.HasValue)
                sb.AppendLine($"Ngân sách trung bình: {preference.AverageBudget:N0} VND");
        }

        if (recentBookings.Any())
        {
            sb.AppendLine($"Lịch sử gần đây: {recentBookings.Count} lượt đặt.");
        }

        return sb.ToString();
    }

    private static string BuildPitchList(List<Pitch> pitches)
    {
        var sb = new StringBuilder();

        foreach (var pitch in pitches.Where(p => p.Status == PitchStatus.Active).Take(30))
        {
            var minPrice = GetPitchMinPrice(pitch);
            sb.AppendLine(
                $"- pitchId: {pitch.Id}; name: {pitch.Name}; type: {pitch.Type}; " +
                $"rating: {pitch.AverageRating:0.0}; indoor: {pitch.IsIndoor}; " +
                $"minPrice: {(minPrice.HasValue ? $"{minPrice:N0} VND" : "N/A")}; " +
                $"address: {pitch.SportCenter?.Address?.GetFullAddress() ?? "N/A"}");
        }

        return sb.ToString();
    }

    private List<RecommendedPitch> ParseRecommendations(string aiResponse, List<Pitch> allPitches)
    {
        var recommendations = new List<RecommendedPitch>();

        try
        {
            var jsonStart = aiResponse.IndexOf('[');
            var jsonEnd = aiResponse.LastIndexOf(']');

            if (jsonStart < 0 || jsonEnd <= jsonStart)
            {
                return recommendations;
            }

            var json = aiResponse.Substring(jsonStart, jsonEnd - jsonStart + 1);
            var parsed = JsonSerializer.Deserialize<List<JsonElement>>(json);
            if (parsed == null) return recommendations;

            foreach (var item in parsed)
            {
                if (!item.TryGetProperty("pitchId", out var pitchIdProp) ||
                    !Guid.TryParse(pitchIdProp.GetString(), out var pitchId))
                {
                    continue;
                }

                var pitch = allPitches.FirstOrDefault(p => p.Id == pitchId);
                if (pitch == null) continue;

                var score = item.TryGetProperty("score", out var scoreProp)
                    ? scoreProp.GetDecimal()
                    : 75m;

                var reasons = new List<string>();
                if (item.TryGetProperty("reasons", out var reasonsProp) &&
                    reasonsProp.ValueKind == JsonValueKind.Array)
                {
                    reasons.AddRange(reasonsProp.EnumerateArray()
                        .Select(reason => reason.GetString())
                        .Where(reason => !string.IsNullOrWhiteSpace(reason))!);
                }

                recommendations.Add(ToRecommendedPitch(pitch, score, reasons));
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse Gemini recommendation JSON.");
        }

        return recommendations
            .GroupBy(r => r.PitchId)
            .Select(g => g.First())
            .OrderByDescending(r => r.Score)
            .Take(5)
            .ToList();
    }

    private static List<RecommendedPitch> BuildSmartFallbackRecommendations(List<Pitch> pitches, string? userQuery)
    {
        var normalizedQuery = Normalize(userQuery ?? string.Empty);
        var budget = ExtractBudget(normalizedQuery);

        return pitches
            .Where(p => p.Status == PitchStatus.Active)
            .Select(p =>
            {
                var score = 55m + Math.Min(p.AverageRating * 8m, 35m);
                var reasons = new List<string>();
                var minPrice = GetPitchMinPrice(p);

                if (MatchesSport(normalizedQuery, p.Type))
                {
                    score += 20m;
                    reasons.Add($"Đúng môn {GetSportLabel(p.Type)} bạn đang tìm.");
                }

                if (budget.HasValue && minPrice.HasValue && minPrice <= budget.Value)
                {
                    score += 15m;
                    reasons.Add($"Giá từ {minPrice:N0} VND, nằm trong ngân sách bạn nêu.");
                }

                if (p.AverageRating > 0)
                {
                    reasons.Add($"Đánh giá trung bình {p.AverageRating:0.0}/5.");
                }

                if (p.IsIndoor && (normalizedQuery.Contains("trong nha") || normalizedQuery.Contains("indoor")))
                {
                    score += 10m;
                    reasons.Add("Có sân trong nhà.");
                }

                if (!reasons.Any())
                {
                    reasons.Add("Sân đang hoạt động và phù hợp để tham khảo.");
                }

                return ToRecommendedPitch(p, Math.Min(score, 98m), reasons);
            })
            .OrderByDescending(p => p.Score)
            .ThenBy(p => p.EstimatedPrice ?? decimal.MaxValue)
            .Take(5)
            .ToList();
    }

    private static RecommendedPitch ToRecommendedPitch(Pitch pitch, decimal score, List<string>? reasons = null)
    {
        return new RecommendedPitch
        {
            PitchId = pitch.Id,
            PitchName = pitch.Name,
            Score = Math.Clamp(score, 0m, 100m),
            Reasons = reasons?.Where(r => !string.IsNullOrWhiteSpace(r)).Take(3).ToList()
                ?? new List<string> { "Sân đang hoạt động", "Phù hợp để đặt lịch nhanh" },
            EstimatedPrice = GetPitchMinPrice(pitch)
        };
    }

    private static string GenerateExplanation(List<RecommendedPitch> recommendations)
    {
        if (!recommendations.Any())
            return "Mình chưa tìm thấy sân phù hợp với tiêu chí này.";

        var top = recommendations.First();
        return $"Mình ưu tiên {top.PitchName} vì {string.Join(", ", top.Reasons.Take(2))}.";
    }

    private static string GenerateConversationalResponse(List<RecommendedPitch> recommendations)
    {
        if (!recommendations.Any())
        {
            return "Mình chưa tìm thấy sân thật khớp. Bạn cho mình thêm môn, khu vực hoặc ngân sách để lọc lại nhé.";
        }

        var top = recommendations.First();
        return $"Mình tìm được {recommendations.Count} sân phù hợp. Gợi ý nổi bật nhất là {top.PitchName}; bạn có thể mở thẻ sân bên dưới để xem chi tiết và đặt lịch.";
    }

    private async Task<PitchRecommendationResponse> GetFallbackRecommendationsAsync(Guid userId, string? userQuery)
    {
        var allPitches = (await _pitchRepository.GetAllAsync()).ToList();
        var recommendations = BuildSmartFallbackRecommendations(allPitches, userQuery);

        return new PitchRecommendationResponse
        {
            Recommendations = recommendations,
            Explanation = GenerateExplanation(recommendations),
            ConversationalResponse = GenerateConversationalResponse(recommendations)
        };
    }

    private static PitchRecommendationResponse EmptyRecommendationResponse()
    {
        return new PitchRecommendationResponse
        {
            Recommendations = new List<RecommendedPitch>(),
            Explanation = "Hiện chưa có sân hoạt động trong hệ thống.",
            ConversationalResponse = "Hiện mình chưa thấy sân nào để gợi ý. Bạn quay lại sau khi chủ sân cập nhật dữ liệu nhé."
        };
    }

    private static string BuildOfflineChatAnswer(string userMessage)
    {
        var normalized = Normalize(userMessage);
        var mathAnswer = TryAnswerSimpleMath(userMessage);

        if (mathAnswer != null)
        {
            return mathAnswer;
        }

        if (normalized.Contains("day san bong da") ||
            normalized.Contains("san bong da ma") ||
            normalized.Contains("sai mon") ||
            normalized.Contains("khong phai cau long"))
        {
            return "Đúng rồi, mình ghi nhận đây là sân bóng đá. Nếu bạn đang ở trang sân này thì mình sẽ ưu tiên tư vấn theo bóng đá: loại sân, giá, khung giờ còn trống và bước đặt sân. Bạn muốn mình so sánh giá, chọn giờ đẹp, hay hướng dẫn đặt sân này?";
        }

        if (normalized.Contains("coc") || normalized.Contains("dat san") || normalized.Contains("thanh toan"))
        {
            return "Bạn chọn sân và khung giờ, hệ thống giữ chỗ tạm thời, sau đó bạn thanh toán cọc 10% qua VNPAY. Phần còn lại thường thanh toán trực tiếp tại sân.";
        }

        if (normalized.Contains("huy") || normalized.Contains("hoan tien"))
        {
            return "Việc hủy sân phụ thuộc chính sách của chủ sân và thời điểm hủy. Thông thường bạn nên hủy càng sớm càng tốt; nếu cần, hãy mở đơn đặt sân trong hồ sơ để kiểm tra trạng thái.";
        }

        if (normalized.Contains("goi y") || normalized.Contains("tim san") || normalized.Contains("san nao"))
        {
            return "Mình có thể gợi ý sân theo môn, khu vực, ngân sách và khung giờ. Ví dụ: “gợi ý sân cầu lông dưới 150k gần Quận 1 lúc 19h”.";
        }

        if (normalized.Contains("xin chao") || normalized.Contains("hello") || normalized.Contains("hi"))
        {
            return "Chào bạn! Mình là SmartSport AI. Bạn có thể hỏi mình về cách đặt sân, thanh toán, hủy lịch, hoặc nhờ gợi ý sân phù hợp.";
        }

        return $"Mình trả lời nhanh nhé: mình hiểu bạn đang hỏi \"{userMessage}\". Nếu là câu hỏi kiến thức chung, bạn có thể hỏi trực tiếp như \"1+1 bằng mấy\", \"giải thích offside\", \"nên khởi động thế nào trước khi đá bóng\". Nếu là câu hỏi về trang hiện tại, hãy nói rõ bạn muốn xem giá, giờ trống, vị trí hay cách đặt sân, mình sẽ trả lời theo đúng ngữ cảnh.";
    }

    private static string? TryAnswerSimpleMath(string message)
    {
        var match = Regex.Match(
            message.Replace(',', '.').Replace('＝', '='),
            @"(-?\d+(?:\.\d+)?)\s*([+\-*/x×÷])\s*(-?\d+(?:\.\d+)?)");

        if (!match.Success ||
            !decimal.TryParse(match.Groups[1].Value, NumberStyles.Number, CultureInfo.InvariantCulture, out var left) ||
            !decimal.TryParse(match.Groups[3].Value, NumberStyles.Number, CultureInfo.InvariantCulture, out var right))
        {
            return null;
        }

        var op = match.Groups[2].Value;
        decimal? result = op switch
        {
            "+" => left + right,
            "-" => left - right,
            "*" or "x" or "×" => left * right,
            "/" or "÷" when right != 0 => left / right,
            "/" or "÷" => null,
            _ => null
        };

        return result == null
            ? "Không thể chia cho 0 nhé."
            : $"{left} {op} {right} = {result}.";
    }

    private static bool IsFailureMessage(string value)
    {
        var text = Normalize(value);
        return text.Contains("xin loi") &&
            (text.Contains("loi xay ra") ||
             text.Contains("vui long thu lai") ||
             text.Contains("khong the tra loi") ||
             text.Contains("dang ban"));
    }

    private static decimal? GetPitchMinPrice(Pitch pitch)
    {
        var prices = pitch.TimeSlots
            .Where(ts => ts.IsActive)
            .Select(ts => ts.Price.Amount)
            .ToList();

        return prices.Any() ? prices.Min() : null;
    }

    private static decimal? ExtractBudget(string normalizedQuery)
    {
        var match = Regex.Match(normalizedQuery, @"(\d+)\s*(k|nghin|ngan|000|vnd|d)?");
        if (!match.Success || !decimal.TryParse(match.Groups[1].Value, out var value))
        {
            return null;
        }

        var unit = match.Groups[2].Value;
        if (unit is "k" or "nghin" or "ngan" || value < 1000)
        {
            value *= 1000;
        }

        return value;
    }

    private static bool MatchesSport(string normalizedQuery, PitchType type)
    {
        return type switch
        {
            PitchType.Football5 or PitchType.Football7 or PitchType.Football11 =>
                normalizedQuery.Contains("bong da") || normalizedQuery.Contains("football") || normalizedQuery.Contains("san 5") || normalizedQuery.Contains("san 7"),
            PitchType.Badminton => normalizedQuery.Contains("cau long") || normalizedQuery.Contains("badminton"),
            PitchType.Tennis => normalizedQuery.Contains("tennis"),
            PitchType.Pickleball => normalizedQuery.Contains("pickleball"),
            PitchType.Basketball => normalizedQuery.Contains("bong ro") || normalizedQuery.Contains("basketball"),
            PitchType.Volleyball => normalizedQuery.Contains("bong chuyen") || normalizedQuery.Contains("volleyball"),
            PitchType.TableTennis => normalizedQuery.Contains("bong ban") || normalizedQuery.Contains("table tennis"),
            _ => false
        };
    }

    private static string GetSportLabel(PitchType type)
    {
        return type switch
        {
            PitchType.Football5 => "bóng đá sân 5",
            PitchType.Football7 => "bóng đá sân 7",
            PitchType.Football11 => "bóng đá sân 11",
            PitchType.Badminton => "cầu lông",
            PitchType.Tennis => "tennis",
            PitchType.Pickleball => "pickleball",
            PitchType.Basketball => "bóng rổ",
            PitchType.Volleyball => "bóng chuyền",
            PitchType.TableTennis => "bóng bàn",
            _ => type.ToString()
        };
    }

    private static string Normalize(string text)
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

        return builder.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
    }
}

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
