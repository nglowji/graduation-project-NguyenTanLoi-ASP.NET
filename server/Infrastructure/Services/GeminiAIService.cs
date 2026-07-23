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
            var targetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
            var allPitches = (await _pitchRepository.GetActiveForRecommendationsAsync(targetDate)).ToList();

            if (!allPitches.Any())
            {
                return EmptyRecommendationResponse();
            }

            if (UseLocalRecommendationRanking())
            {
                var immediateRecommendations = BuildSmartFallbackRecommendations(allPitches, userQuery, preference, recentBookings);
                return new PitchRecommendationResponse
                {
                    Recommendations = immediateRecommendations,
                    Explanation = GenerateExplanation(immediateRecommendations),
                    ConversationalResponse = GenerateConversationalResponse(immediateRecommendations)
                };
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
                recommendations = BuildSmartFallbackRecommendations(allPitches, userQuery, preference, recentBookings);
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
Bạn là SmartSport AI, trợ lý web của nền tảng đặt sân thể thao SmartSport.

Nhiệm vụ chính:
- Trả lời như một trợ lý thật: hiểu ngữ cảnh, nhớ hội thoại gần đây, hỏi lại khi thiếu dữ kiện.
- Dùng dữ liệu hệ thống được cung cấp trong SMARTSPORT_SYSTEM_DATA để tư vấn sân, giá, loại sân, quy trình đặt sân và lịch sử của người dùng.
- Có thể trả lời câu hỏi ngoài hệ thống như luật thể thao, khởi động, dinh dưỡng cơ bản, tính toán đơn giản hoặc kiến thức phổ thông.

Kiến thức SmartSport cần nắm:
- Người chơi tìm sân theo môn, khu vực, ngân sách, khung giờ, sân trong nhà/ngoài trời.
- Quy trình đặt sân: chọn sân và khung giờ, giữ chỗ, thanh toán cọc 10% qua VNPAY, nhận mã check-in.
- Chủ sân quản lý sân, lịch đặt, dịch vụ, đánh giá và doanh thu. Admin duyệt sân, quản lý người dùng, doanh thu và báo cáo hoa hồng.
- Booking hợp lệ thường là Confirmed hoặc Completed. PendingDeposit là chờ thanh toán cọc.
- Các tình huống khách hay hỏi: tìm sân theo môn/giá/giờ/khu vực, xem giờ trống, cách đặt sân, tiền cọc, thanh toán VNPAY, mã check-in, hủy lịch, hoàn tiền, lịch sử đặt sân, đánh giá sân.
- Các tình huống chủ sân hay hỏi: tạo/sửa sân, thêm ảnh, thêm khung giờ, đặt giá từng khung giờ, quản lý booking, quản lý dịch vụ, xem review, xem doanh thu.
- Các tình huống staff hay hỏi: hỗ trợ khách tại sân, kiểm tra lịch đặt, kiểm tra mã check-in, cập nhật việc vận hành theo phân quyền của chủ sân.
- Các tình huống admin hay hỏi: duyệt đối tác, duyệt sân/dịch vụ, quản lý người dùng, kiểm duyệt nội dung, cấu hình hệ thống, theo dõi doanh thu nền tảng và hoa hồng.
- Giá sân phải lấy đúng giá của TimeSlot trong dữ liệu hệ thống. Không tự thêm phụ phí giờ tối, cuối tuần hoặc hệ số tăng giá nếu dữ liệu không nói rõ.

Quy tắc trả lời:
- Luôn dùng tiếng Việt tự nhiên, ngắn gọn, có ích, giống đang chat trực tiếp với người dùng.
- Không bịa tên sân, giá, địa chỉ, khung giờ hoặc dữ liệu người dùng nếu không có trong SMARTSPORT_SYSTEM_DATA.
- Khi người dùng hỏi tìm sân, hãy tóm tắt tiêu chí, đưa gợi ý hợp lý và nhắc họ mở các thẻ sân bên dưới nếu hệ thống trả về recommendations.
- Với câu hỏi ngoài lề, trả lời bình thường ở mức tổng quát; chỉ kéo về SmartSport khi thật sự phù hợp.
- Nếu câu hỏi liên quan y tế, pháp lý, tài chính nghiêm trọng, hãy trả lời an toàn, khuyên người dùng tham khảo chuyên gia.
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

    private static List<RecommendedPitch> BuildSmartFallbackRecommendations(
        List<Pitch> pitches,
        string? userQuery,
        UserPreference? preference = null,
        List<Booking>? recentBookings = null)
    {
        var activePitches = pitches.Where(p => p.Status == PitchStatus.Active).ToList();
        if (!activePitches.Any()) return new List<RecommendedPitch>();

        var normalizedQuery = Normalize(userQuery ?? string.Empty);
        var budget = ExtractBudget(normalizedQuery);
        var requestedTime = ExtractRequestedTime(normalizedQuery);
        var requestedSport = ExtractSportType(normalizedQuery);
        var priceSort = ExtractPriceSort(normalizedQuery);
        var targetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
        var behavior = UserTrainingProfile.From(preference, recentBookings ?? new List<Booking>());

        var candidates = activePitches
            .Where(p => p.Status == PitchStatus.Active)
            .Where(p => SportMatchesRequestedType(p.Type, requestedSport))
            .Select(p =>
            {
                var score = 55m + Math.Min(p.AverageRating * 8m, 35m);
                var reasons = new List<string>();
                var minPrice = GetPitchMinPrice(p);
                var maxPrice = GetPitchMaxPrice(p);
                var displayPrice = priceSort == PriceSort.Highest ? maxPrice : minPrice;
                var matchingSlots = p.TimeSlots
                    .Where(ts => IsSlotAvailableForCriteria(ts, targetDate, requestedTime, budget))
                    .OrderBy(ts => ts.TimeRange.StartTime)
                    .ToList();

                if ((requestedTime.HasValue || budget.HasValue) && !matchingSlots.Any())
                {
                    return null;
                }

                if (MatchesSport(normalizedQuery, p.Type))
                {
                    score += 20m;
                    reasons.Add($"Đúng môn {GetSportLabel(p.Type)} bạn đang tìm.");
                }

                if (!MatchesSport(normalizedQuery, p.Type) && behavior.TypeWeights.TryGetValue(p.Type, out var typeWeight))
                {
                    score += Math.Min(typeWeight * 10m, 16m);
                    reasons.Add($"Phù hợp thói quen hay đặt {GetSportLabel(p.Type)} của bạn.");
                }

                if (budget.HasValue && minPrice.HasValue && minPrice <= budget.Value)
                {
                    score += 15m;
                    reasons.Add($"Giá từ {minPrice:N0} VND, nằm trong ngân sách bạn nêu.");
                }

                if (priceSort == PriceSort.Highest && maxPrice.HasValue)
                {
                    score = 60m + Math.Min(maxPrice.Value / 10000m, 35m);
                    reasons.Insert(0, $"Giá cao nhất trong các khung giờ là {maxPrice.Value:N0} VND.");
                }
                else if (priceSort == PriceSort.Lowest && minPrice.HasValue)
                {
                    score = 95m - Math.Min(minPrice.Value / 10000m, 45m);
                    reasons.Insert(0, $"Giá thấp nhất trong các khung giờ là {minPrice.Value:N0} VND.");
                }

                if (requestedTime.HasValue && matchingSlots.Any())
                {
                    var slot = matchingSlots.First();
                    score += 18m;
                    reasons.Add($"Có khung {slot.TimeRange.StartTime:hh\\:mm}-{slot.TimeRange.EndTime:hh\\:mm} phù hợp giờ bạn hỏi.");
                }

                if (!budget.HasValue && behavior.AverageBudget.HasValue && minPrice.HasValue)
                {
                    var budgetDistance = Math.Abs(minPrice.Value - behavior.AverageBudget.Value) / Math.Max(behavior.AverageBudget.Value, 1m);
                    score += Math.Max(0m, 9m - budgetDistance * 9m);
                    if (budgetDistance <= 0.25m)
                    {
                        reasons.Add("Mức giá gần với thói quen chi tiêu trước đây của bạn.");
                    }
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

                if (behavior.CenterWeights.TryGetValue(p.SportCenterId, out var centerWeight))
                {
                    score += Math.Min(centerWeight * 6m, 12m);
                    reasons.Add("Bạn từng đặt sân tại trung tâm này hoặc trung tâm tương tự.");
                }

                var activeSlots = p.TimeSlots.Count(ts => ts.IsActive);
                if (activeSlots > 0)
                {
                    score += Math.Min(activeSlots, 6) * 1.25m;
                }

                if (!reasons.Any())
                {
                    reasons.Add("Sân đang hoạt động và phù hợp để tham khảo.");
                }

                return ToRecommendedPitch(p, Math.Min(score, 98m), reasons, displayPrice);
            })
            .Where(p => p != null)
            .Select(p => p!)
            .OrderBy(p => priceSort == PriceSort.Lowest ? p.EstimatedPrice ?? decimal.MaxValue : decimal.Zero)
            .ThenByDescending(p => priceSort == PriceSort.Highest ? p.EstimatedPrice ?? decimal.Zero : p.Score)
            .ThenByDescending(p => p.Score)
            .Take(12)
            .ToList();

        return DiversifyRecommendations(candidates, 5);
    }

    private static bool UseLocalRecommendationRanking() => true;

    private static List<RecommendedPitch> DiversifyRecommendations(List<RecommendedPitch> candidates, int limit)
    {
        return candidates
            .GroupBy(item => item.PitchId)
            .Select(group => group.First())
            .OrderByDescending(item => item.Score)
            .Take(limit)
            .ToList();
    }

    private sealed class UserTrainingProfile
    {
        public Dictionary<PitchType, decimal> TypeWeights { get; } = new();
        public Dictionary<Guid, decimal> CenterWeights { get; } = new();
        public decimal? AverageBudget { get; private init; }

        public static UserTrainingProfile From(UserPreference? preference, List<Booking> bookings)
        {
            var profile = new UserTrainingProfile
            {
                AverageBudget = preference?.AverageBudget ?? bookings
                    .Where(booking => booking.TotalPrice.Amount > 0)
                    .Select(booking => (decimal?)booking.TotalPrice.Amount)
                    .DefaultIfEmpty()
                    .Average()
            };

            if (preference?.PreferredPitchTypes.Any() == true)
            {
                foreach (var typeValue in preference.PreferredPitchTypes)
                {
                    if (Enum.IsDefined(typeof(PitchType), typeValue))
                    {
                        profile.TypeWeights[(PitchType)typeValue] = profile.TypeWeights.GetValueOrDefault((PitchType)typeValue) + 1.4m;
                    }
                }
            }

            foreach (var booking in bookings)
            {
                var pitch = booking.TimeSlot?.Pitch;
                if (pitch == null) continue;

                profile.TypeWeights[pitch.Type] = profile.TypeWeights.GetValueOrDefault(pitch.Type) + 1m;
                profile.CenterWeights[pitch.SportCenterId] = profile.CenterWeights.GetValueOrDefault(pitch.SportCenterId) + 1m;
            }

            return profile;
        }
    }

    private static RecommendedPitch ToRecommendedPitch(Pitch pitch, decimal score, List<string>? reasons = null, decimal? estimatedPrice = null)
    {
        return new RecommendedPitch
        {
            PitchId = pitch.Id,
            PitchName = pitch.Name,
            Score = Math.Clamp(score, 0m, 100m),
            Reasons = reasons?.Where(r => !string.IsNullOrWhiteSpace(r)).Take(3).ToList()
                ?? new List<string> { "Sân đang hoạt động", "Phù hợp để đặt lịch nhanh" },
            EstimatedPrice = estimatedPrice ?? GetPitchMinPrice(pitch)
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
        var targetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
        var allPitches = (await _pitchRepository.GetActiveForRecommendationsAsync(targetDate)).ToList();
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

        if (normalized.Contains("pendingdeposit") || normalized.Contains("confirmed") ||
            normalized.Contains("completed") || normalized.Contains("cancelled") ||
            normalized.Contains("noshow") || normalized.Contains("trang thai"))
        {
            return "Các trạng thái chính: PendingDeposit là chờ thanh toán cọc; Confirmed là đã xác nhận; Completed là đã hoàn thành; Cancelled là đã hủy; NoShow là không đến sân. Với đơn cụ thể, hãy xem trong hồ sơ/lịch sử đặt sân để lấy trạng thái mới nhất.";
        }

        if (normalized.Contains("check-in") || normalized.Contains("checkin") ||
            normalized.Contains("ma check") || normalized.Contains("qr"))
        {
            return "Mã check-in nằm trong chi tiết đặt sân sau khi hệ thống ghi nhận đơn theo quy trình thanh toán. Khi tới sân, bạn đưa mã này cho chủ sân hoặc nhân viên để xác nhận lịch.";
        }

        if (normalized.Contains("chu san") || normalized.Contains("owner") ||
            normalized.Contains("doanh thu") || normalized.Contains("khung gio") ||
            normalized.Contains("them san") || normalized.Contains("sua san"))
        {
            return "Chủ sân có thể quản lý sân, ảnh, khung giờ, giá từng khung, booking, dịch vụ, đánh giá và doanh thu. Giá hệ thống dùng đúng giá từng TimeSlot chủ sân đã tạo, không tự cộng phụ phí giờ tối.";
        }

        if (normalized.Contains("staff") || normalized.Contains("nhan vien"))
        {
            return "Staff hỗ trợ vận hành sân theo phân quyền của chủ sân: theo dõi lịch đặt, hỗ trợ khách tại sân, kiểm tra mã check-in và xử lý các việc hằng ngày.";
        }

        if (normalized.Contains("admin") || normalized.Contains("duyet") ||
            normalized.Contains("doi tac") || normalized.Contains("hoa hong") ||
            normalized.Contains("kiem duyet"))
        {
            return "Admin quản lý toàn nền tảng: duyệt đối tác/sân/dịch vụ, quản lý người dùng, kiểm duyệt nội dung, cấu hình hệ thống, theo dõi doanh thu nền tảng và hoa hồng.";
        }

        if (normalized.Contains("dich vu") || normalized.Contains("thue vot") ||
            normalized.Contains("nuoc uong") || normalized.Contains("phu kien"))
        {
            return "Dịch vụ đi kèm do chủ sân cấu hình riêng, ví dụ thuê vợt, nước uống hoặc phụ kiện. Khi đặt sân, người chơi có thể chọn thêm dịch vụ đang hoạt động và còn hàng.";
        }

        if (normalized.Contains("danh gia") || normalized.Contains("review") ||
            normalized.Contains("phan hoi"))
        {
            return "Sau khi lịch hoàn thành, người chơi có thể đánh giá sân trong hồ sơ/lịch sử đặt sân. Chủ sân có thể xem và phản hồi đánh giá trong trang quản lý.";
        }

        if (normalized.Contains("day san bong da") ||
            normalized.Contains("san bong da ma") ||
            normalized.Contains("sai mon") ||
            normalized.Contains("khong phai cau long"))
        {
            return "Đúng rồi, mình ghi nhận đây là sân bóng đá. Nếu bạn đang ở trang sân này thì mình sẽ ưu tiên tư vấn theo bóng đá: loại sân, giá, khung giờ còn trống và bước đặt sân. Bạn muốn mình so sánh giá, chọn giờ đẹp, hay hướng dẫn đặt sân này?";
        }

        if (normalized.Contains("offside") || normalized.Contains("viet vi"))
        {
            return "Luật việt vị hiểu nhanh là: cầu thủ tấn công đứng gần khung thành đối phương hơn bóng và hơn hậu vệ áp chót tại thời điểm đồng đội chuyền bóng, rồi tham gia vào pha bóng. Không việt vị nếu nhận bóng từ phạt góc, ném biên hoặc phát bóng lên.";
        }

        if (normalized.Contains("khoi dong") || normalized.Contains("warm up"))
        {
            return "Trước khi chơi, hãy khởi động 8-12 phút: xoay khớp, chạy nhẹ, ép động, rồi tăng tốc ngắn 3-4 lần. Mục tiêu là làm nóng cơ thể, không làm mỏi trước trận.";
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

    private static decimal? GetPitchMaxPrice(Pitch pitch)
    {
        var prices = pitch.TimeSlots
            .Where(ts => ts.IsActive)
            .Select(ts => ts.Price.Amount)
            .ToList();

        return prices.Any() ? prices.Max() : null;
    }

    private static PriceSort ExtractPriceSort(string normalizedQuery)
    {
        if (normalizedQuery.Contains("cao nhat") ||
            normalizedQuery.Contains("dat nhat") ||
            normalizedQuery.Contains("mac nhat") ||
            normalizedQuery.Contains("gia cao") ||
            normalizedQuery.Contains("max price") ||
            normalizedQuery.Contains("highest price"))
        {
            return PriceSort.Highest;
        }

        if (normalizedQuery.Contains("re nhat") ||
            normalizedQuery.Contains("thap nhat") ||
            normalizedQuery.Contains("gia re") ||
            normalizedQuery.Contains("gia thap") ||
            normalizedQuery.Contains("min price") ||
            normalizedQuery.Contains("lowest price"))
        {
            return PriceSort.Lowest;
        }

        return PriceSort.None;
    }

    private enum PriceSort
    {
        None,
        Highest,
        Lowest
    }

    private static decimal? ExtractBudget(string normalizedQuery)
    {
        var match = Regex.Match(normalizedQuery, @"(\d+)\s*(k|nghin|ngan|000|vnd|d)");
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

    private static TimeSpan? ExtractRequestedTime(string normalizedQuery)
    {
        var match = Regex.Match(
            normalizedQuery,
            @"(?:luc\s*)?(\d{1,2})(?:\s*(?:h|gio|:)\s*(\d{1,2}))?");

        if (!match.Success || !int.TryParse(match.Groups[1].Value, out var hour))
        {
            return null;
        }

        var minute = 0;
        if (match.Groups[2].Success)
        {
            int.TryParse(match.Groups[2].Value, out minute);
        }

        if (hour < 0 || hour > 23 || minute < 0 || minute > 59)
        {
            return null;
        }

        return new TimeSpan(hour, minute, 0);
    }

    private static PitchType? ExtractSportType(string normalizedQuery)
    {
        if (normalizedQuery.Contains("cau long") || normalizedQuery.Contains("badminton"))
            return PitchType.Badminton;
        if (normalizedQuery.Contains("tennis"))
            return PitchType.Tennis;
        if (normalizedQuery.Contains("pickleball"))
            return PitchType.Pickleball;
        if (normalizedQuery.Contains("bong ro") || normalizedQuery.Contains("basketball"))
            return PitchType.Basketball;
        if (normalizedQuery.Contains("bong chuyen") || normalizedQuery.Contains("volleyball"))
            return PitchType.Volleyball;
        if (normalizedQuery.Contains("bong ban") || normalizedQuery.Contains("table tennis"))
            return PitchType.TableTennis;
        if (normalizedQuery.Contains("san 11"))
            return PitchType.Football11;
        if (normalizedQuery.Contains("san 7"))
            return PitchType.Football7;
        if (normalizedQuery.Contains("bong da") || normalizedQuery.Contains("football") || normalizedQuery.Contains("san 5"))
            return PitchType.Football5;

        return null;
    }

    private static bool IsSlotAvailableForCriteria(TimeSlot slot, DateOnly targetDate, TimeSpan? requestedTime, decimal? budget)
    {
        if (!slot.IsActive)
        {
            return false;
        }

        if (requestedTime.HasValue && !slot.TimeRange.Contains(requestedTime.Value))
        {
            return false;
        }

        if (budget.HasValue && slot.Price.Amount > budget.Value)
        {
            return false;
        }

        return !slot.Bookings.Any(booking =>
            booking.BookingDate == targetDate &&
            booking.Status is BookingStatus.PendingDeposit or BookingStatus.Confirmed or BookingStatus.Completed);
    }

    private static bool SportMatchesRequestedType(PitchType pitchType, PitchType? requestedType)
    {
        if (!requestedType.HasValue)
        {
            return true;
        }

        if (requestedType.Value == PitchType.Football5)
        {
            return pitchType is PitchType.Football5 or PitchType.Football7 or PitchType.Football11;
        }

        return pitchType == requestedType.Value;
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
