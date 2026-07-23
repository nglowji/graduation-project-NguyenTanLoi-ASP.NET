using System.Globalization;
using System.Text;
using Application.Common.DTOs;
using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

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
    private readonly IApplicationDbContext _context;
    private readonly IBookingRepository _bookingRepository;

    // Vietnam timezone – resolved once, shared
    private static readonly TimeZoneInfo VnZone = ResolveVnZone();

    private static TimeZoneInfo ResolveVnZone()
    {
        foreach (var id in new[] { "Asia/Ho_Chi_Minh", "SE Asia Standard Time" })
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch (TimeZoneNotFoundException) { }
        }
        return TimeZoneInfo.Local;
    }

    public ChatWithAICommandHandler(
        IGeminiAIService geminiService,
        IChatConversationRepository conversationRepository,
        IBookingRepository bookingRepository,
        IApplicationDbContext context)
    {
        _geminiService = geminiService;
        _conversationRepository = conversationRepository;
        _bookingRepository = bookingRepository;
        _context = context;
    }

    public async Task<ChatWithAIResponse> Handle(ChatWithAICommand request, CancellationToken cancellationToken)
    {
        var sessionId = request.SessionId ?? Guid.NewGuid().ToString();

        // Load conversation + session data in parallel
        var conversationTask = _conversationRepository.GetBySessionIdAsync(sessionId, cancellationToken);
        var criteria = ChatSearchCriteria.FromMessage(request.Message);

        var conversation = await conversationTask;
        if (conversation == null)
        {
            conversation = Domain.Entities.ChatConversation.Create(request.UserId, sessionId);
            await _conversationRepository.CreateAsync(conversation, cancellationToken);
        }

        conversation.AddMessage("user", request.Message);
        var context = await BuildConversationContextAsync(request.UserId, conversation, criteria, cancellationToken);

        List<RecommendedPitch>? recommendations = null;
        if (IsAskingForRecommendations(request.Message))
        {
            var recoResult = await _geminiService.GetPitchRecommendationsAsync(request.UserId, request.Message);
            recommendations = recoResult.Recommendations;
        }

        var aiResponse = await _geminiService.ChatAsync(request.Message, context);

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

    private async Task<string> BuildConversationContextAsync(
        Guid userId,
        Domain.Entities.ChatConversation conversation,
        ChatSearchCriteria criteria,
        CancellationToken cancellationToken)
    {
        var vnNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VnZone);
        var recentMessages = conversation.Messages
            .TakeLast(8)
            .Select(m => $"{m.Role}: {m.Content}")
            .ToList();
        var activePitches = await _context.Pitches
            .AsNoTracking()
            .Include(p => p.SportCenter)
            .Include(p => p.TimeSlots)
                .ThenInclude(ts => ts.Bookings)
            .Where(p => p.Status == PitchStatus.Active && p.SportCenter.IsActive)
            .OrderByDescending(p => p.AverageRating)
            .ThenBy(p => p.Name)
            .Take(20)
            .ToListAsync(cancellationToken);

        var recentBookings = userId != Guid.Empty
            ? await _bookingRepository.GetByUserIdAsync(userId, 1, 5, null, cancellationToken)
            : PagedResult<Domain.Entities.Booking>.Empty(1, 5);

        var builder = new StringBuilder(2048);

        // ── THỜI GIAN HIỆN TẠI ──────────────────────────────────────────────
        builder.AppendLine($"THỜI GIAN HIỆN TẠI: {vnNow:dd/MM/yyyy HH:mm} (Múi giờ: Asia/Ho_Chi_Minh, {GetVietnameseDayOfWeek(vnNow)})");
        builder.AppendLine();

        // ── THÔNG TIN PLATFORM ────────────────────────────────────────────────
        builder.AppendLine("THÔNG TIN PLATFORM:");
        builder.AppendLine("- SmartSport: nền tảng đặt sân thể thao trực tuyến tại Việt Nam.");
        builder.AppendLine("- Quy trình: chọn sân → chọn khung giờ → thanh toán cọc 10% qua VNPAY → nhận mã check-in.");
        builder.AppendLine("- Trạng thái booking: PendingDeposit=chờ cọc | Confirmed=đã xác nhận | Completed=hoàn thành | Cancelled=đã hủy | NoShow=không đến.");
        builder.AppendLine("- Không bịa dữ liệu. Chỉ dùng thông tin có trong phần THÔNG TIN HỆ THỐNG bên dưới.");
        builder.AppendLine();

        if (activePitches.Any())
        {
            // ── TIÊU CHÍ TÌM SÂN ────────────────────────────────────────────
            if (criteria.HasAny)
            {
                builder.AppendLine("TIÊU CHÍ TÌM SÂN:");
                if (criteria.SportType.HasValue)
                    builder.AppendLine($"  Môn: {GetSportLabel(criteria.SportType.Value)}");
                if (criteria.RequestedTime.HasValue)
                    builder.AppendLine($"  Giờ yêu cầu: {FormatTime(criteria.RequestedTime.Value)}");
                if (criteria.Budget.HasValue)
                    builder.AppendLine($"  Ngân sách tối đa: {criteria.Budget.Value:N0} VND");
                builder.AppendLine($"  Ngày kiểm tra: {criteria.TargetDate:dd/MM/yyyy} ({GetVietnameseDayOfWeek(criteria.TargetDate.ToDateTime(TimeOnly.MinValue))})");
                builder.AppendLine();
            }

            // ── SÂN TRỐNG PHÙ HỢP ────────────────────────────────────────────
            var matchingPitches = activePitches
                .Where(p => SportMatchesCriteria(p.Type, criteria.SportType))
                .Select(p => new
                {
                    Pitch = p,
                    AvailableSlots = p.TimeSlots
                        .Where(ts => IsSlotUsefulForCriteria(ts, criteria))
                        .OrderBy(ts => ts.TimeRange.StartTime)
                        .Take(4)
                        .ToList()
                })
                .Where(item => item.AvailableSlots.Any())
                .OrderByDescending(item => item.Pitch.AverageRating)
                .ThenBy(item => item.AvailableSlots.Min(ts => ts.Price.Amount))
                .Take(8)
                .ToList();

            if (criteria.HasAny)
            {
                if (matchingPitches.Any())
                {
                    builder.AppendLine($"SÂN TRỐNG PHÙ HỢP ({matchingPitches.Count} sân tìm thấy):");
                    var rank = 1;
                    foreach (var item in matchingPitches)
                    {
                        var slots = string.Join(" | ", item.AvailableSlots.Select(ts =>
                            $"{FormatTime(ts.TimeRange.StartTime)}-{FormatTime(ts.TimeRange.EndTime)}: {ts.Price.Amount:N0} VND"));
                        var address = item.Pitch.SportCenter?.Address?.GetFullAddress() ?? "N/A";
                        builder.AppendLine($"  {rank}. {item.Pitch.Name}");
                        builder.AppendLine($"     Môn: {GetSportLabel(item.Pitch.Type)} | Đánh giá: {item.Pitch.AverageRating:0.0}★");
                        builder.AppendLine($"     Địa chỉ: {address}");
                        builder.AppendLine($"     Khung giờ trống: {slots}");
                        rank++;
                    }
                }
                else
                {
                    builder.AppendLine("SÂN TRỐNG PHÙ HỢP: Không tìm thấy sân trống nào khớp tiêu chí trên trong hệ thống hiện tại.");
                }
                builder.AppendLine();
            }

            // ── TẤT CẢ SÂN ĐANG HOẠT ĐỘNG (tham khảo) ──────────────────────
            if (!criteria.HasAny)
            {
                builder.AppendLine($"TẤT CẢ SÂN ĐANG HOẠT ĐỘNG ({activePitches.Count} sân):");
                var i = 1;
                foreach (var pitch in activePitches.Take(12))
                {
                    var minPrice = pitch.TimeSlots
                        .Where(ts => ts.IsActive)
                        .Select(ts => ts.Price.Amount)
                        .Where(p => p > 0)
                        .Cast<decimal?>()
                        .Min();
                    builder.AppendLine($"  {i}. {pitch.Name} | {GetSportLabel(pitch.Type)} | giá từ {(minPrice.HasValue ? $"{minPrice:N0} VND" : "chưa có")} | {pitch.AverageRating:0.0}★ | {pitch.SportCenter?.Address?.GetFullAddress() ?? "N/A"}");
                    i++;
                }
                builder.AppendLine();
            }
        }
        else
        {
            builder.AppendLine("SÂN ĐANG HOẠT ĐỘNG: Hiện chưa có sân nào trong hệ thống.");
            builder.AppendLine();
        }

        // ── LỊCH SỬ ĐẶT SÂN ─────────────────────────────────────────────────
        if (recentBookings.Items.Any())
        {
            builder.AppendLine("LỊCH SỬ ĐẶT SÂN GẦN ĐÂY:");
            foreach (var booking in recentBookings.Items)
            {
                builder.AppendLine($"  - {booking.BookingDate:dd/MM/yyyy}: {booking.TimeSlot?.Pitch?.Name ?? "Sân"} | {booking.TotalPrice.Amount:N0} VND | {booking.Status}");
            }
            builder.AppendLine();
        }

        // ── HỘI THOẠI GẦN ĐÂY ──────────────────────────────────────────────
        if (recentMessages.Count > 1)
        {
            builder.AppendLine("HỘI THOẠI GẦN ĐÂY:");
            builder.AppendLine(string.Join("\n", recentMessages.SkipLast(1)));
        }

        return builder.ToString();
    }

    private static bool IsSlotUsefulForCriteria(Domain.Entities.TimeSlot slot, ChatSearchCriteria criteria)
    {
        if (!slot.IsActive) return false;

        if (criteria.RequestedTime.HasValue && !slot.TimeRange.Contains(criteria.RequestedTime.Value))
            return false;

        if (criteria.Budget.HasValue && slot.Price.Amount > criteria.Budget.Value)
            return false;

        return !slot.Bookings.Any(booking =>
            booking.BookingDate == criteria.TargetDate &&
            booking.Status is BookingStatus.PendingDeposit or BookingStatus.Confirmed or BookingStatus.Completed);
    }

    private static string FormatTime(TimeSpan time) => time.ToString(@"hh\:mm");

    private static string GetVietnameseDayOfWeek(DateTime dt) => dt.DayOfWeek switch
    {
        DayOfWeek.Monday => "Thứ Hai",
        DayOfWeek.Tuesday => "Thứ Ba",
        DayOfWeek.Wednesday => "Thứ Tư",
        DayOfWeek.Thursday => "Thứ Năm",
        DayOfWeek.Friday => "Thứ Sáu",
        DayOfWeek.Saturday => "Thứ Bảy",
        DayOfWeek.Sunday => "Chủ Nhật",
        _ => dt.DayOfWeek.ToString()
    };

    private static bool SportMatchesCriteria(PitchType pitchType, PitchType? requestedType)
    {
        if (!requestedType.HasValue) return true;
        if (requestedType.Value == PitchType.Football5)
            return pitchType is PitchType.Football5 or PitchType.Football7 or PitchType.Football11;
        return pitchType == requestedType.Value;
    }

    private static string GetSportLabel(PitchType type) => type switch
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

    private static bool IsAskingForRecommendations(string message)
    {
        var normalized = RemoveDiacritics(message).ToLowerInvariant();
        var keywords = new[]
        {
            "goi y", "recommend", "de xuat", "tu van",
            "tim san", "san nao", "san gan", "san phu hop",
            "dat san", "book", "booking", "choi o dau",
            "con trong", "gio trong", "khung gio", "toi nay",
            "duoi", "ngan sach", "gia", "bao nhieu",
            "cao nhat", "dat nhat", "mac nhat", "gia cao",
            "re nhat", "thap nhat", "gia re", "gia thap",
            "bong da", "cau long", "tennis", "pickleball", "bong ro", "bong chuyen", "bong ban"
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
                builder.Append(character);
        }
        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    private enum PriceSort { None, Highest, Lowest }

    private sealed class ChatSearchCriteria
    {
        public PitchType? SportType { get; init; }
        public TimeSpan? RequestedTime { get; init; }
        public decimal? Budget { get; init; }
        public PriceSort PriceSort { get; init; }
        public DateOnly TargetDate { get; init; } = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
        public bool HasAny => SportType.HasValue || RequestedTime.HasValue || Budget.HasValue || PriceSort != PriceSort.None;

        public static ChatSearchCriteria FromMessage(string message)
        {
            var normalized = RemoveDiacritics(message).ToLowerInvariant();
            return new ChatSearchCriteria
            {
                SportType = ExtractSportType(normalized),
                RequestedTime = ExtractRequestedTime(normalized),
                Budget = ExtractBudget(normalized),
                PriceSort = ExtractPriceSort(normalized)
            };
        }

        private static PriceSort ExtractPriceSort(string normalized)
        {
            if (normalized.Contains("cao nhat") || normalized.Contains("dat nhat") ||
                normalized.Contains("mac nhat") || normalized.Contains("gia cao"))
                return PriceSort.Highest;

            if (normalized.Contains("re nhat") || normalized.Contains("thap nhat") ||
                normalized.Contains("gia re") || normalized.Contains("gia thap"))
                return PriceSort.Lowest;

            return PriceSort.None;
        }

        private static PitchType? ExtractSportType(string normalized)
        {
            if (normalized.Contains("cau long") || normalized.Contains("badminton")) return PitchType.Badminton;
            if (normalized.Contains("tennis")) return PitchType.Tennis;
            if (normalized.Contains("pickleball")) return PitchType.Pickleball;
            if (normalized.Contains("bong ro") || normalized.Contains("basketball")) return PitchType.Basketball;
            if (normalized.Contains("bong chuyen") || normalized.Contains("volleyball")) return PitchType.Volleyball;
            if (normalized.Contains("bong ban") || normalized.Contains("table tennis")) return PitchType.TableTennis;
            if (normalized.Contains("san 11")) return PitchType.Football11;
            if (normalized.Contains("san 7")) return PitchType.Football7;
            if (normalized.Contains("bong da") || normalized.Contains("football") || normalized.Contains("san 5")) return PitchType.Football5;
            return null;
        }

        private static TimeSpan? ExtractRequestedTime(string normalized)
        {
            // Handle "tối nay / toi nay" → default 19:00 if no explicit hour
            bool isTonay = normalized.Contains("toi nay") || normalized.Contains("tối nay");

            var match = System.Text.RegularExpressions.Regex.Match(
                normalized,
                @"(?:luc\s*)?(\d{1,2})(?:\s*(?:h|gio|:)\s*(\d{1,2}))?");

            if (!match.Success)
                return isTonay ? new TimeSpan(19, 0, 0) : null;

            if (!int.TryParse(match.Groups[1].Value, out var hour)) return null;

            var minute = 0;
            if (match.Groups[2].Success) int.TryParse(match.Groups[2].Value, out minute);

            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

            // "7h tối" → add 12 if PM indicator and hour < 12
            bool hasPm = normalized.Contains("toi") || normalized.Contains("chieu") || normalized.Contains("dem");
            if (hasPm && hour < 12) hour += 12;

            return new TimeSpan(hour, minute, 0);
        }

        private static decimal? ExtractBudget(string normalized)
        {
            var match = System.Text.RegularExpressions.Regex.Match(
                normalized,
                @"(?:duoi|toi da|khoang|gia)?\s*(\d+)\s*(k|nghin|ngan|000|vnd|d)");

            if (!match.Success || !decimal.TryParse(match.Groups[1].Value, out var value))
                return null;

            var unit = match.Groups[2].Value;
            if (unit is "k" or "nghin" or "ngan" || value < 1000) value *= 1000;

            return value;
        }
    }
}
