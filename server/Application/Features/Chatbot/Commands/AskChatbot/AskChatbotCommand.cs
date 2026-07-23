using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Chatbot.Commands.AskChatbot;

public record AskChatbotCommand : IRequest<AskChatbotResponse>
{
    public string Message { get; init; } = null!;
}

public class AskChatbotResponse
{
    public string Answer { get; set; } = null!;
    public List<string> Suggestions { get; set; } = new();
}

public class AskChatbotCommandHandler : IRequestHandler<AskChatbotCommand, AskChatbotResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IGeminiService _geminiService;

    public AskChatbotCommandHandler(IApplicationDbContext context, IGeminiService geminiService)
    {
        _context = context;
        _geminiService = geminiService;
    }

    public async Task<AskChatbotResponse> Handle(AskChatbotCommand request, CancellationToken cancellationToken)
    {
        // 1. Get current time in Asia/Ho_Chi_Minh timezone
        TimeZoneInfo hcmZone;
        try
        {
            hcmZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
        }
        catch (TimeZoneNotFoundException)
        {
            try
            {
                hcmZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                hcmZone = TimeZoneInfo.Local;
            }
        }
        DateTime hcmNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, hcmZone);

        // 2. Parse query parameters
        var parsed = ParseQuery(request.Message, hcmNow);

        // 3. Query matching active pitches and available slots
        var activePitches = await _context.Pitches
            .AsNoTracking()
            .Include(p => p.SportCenter)
            .Include(p => p.TimeSlots)
                .ThenInclude(ts => ts.Bookings)
            .Where(p => p.Status == PitchStatus.Active && p.SportCenter.IsActive)
            .ToListAsync(cancellationToken);

        // Filter by sport type if specified
        if (parsed.SportType.HasValue)
        {
            activePitches = activePitches
                .Where(p => SportMatchesCriteria(p.Type, parsed.SportType.Value))
                .ToList();
        }

        // Filter by location if specified
        if (!string.IsNullOrEmpty(parsed.Location))
        {
            var normLocation = NormalizeText(parsed.Location);
            activePitches = activePitches
                .Where(p => 
                    NormalizeText(p.SportCenter.Name).Contains(normLocation) ||
                    NormalizeText(p.SportCenter.Address.Street).Contains(normLocation) ||
                    NormalizeText(p.SportCenter.Address.Ward).Contains(normLocation) ||
                    NormalizeText(p.SportCenter.Address.District).Contains(normLocation) ||
                    NormalizeText(p.SportCenter.Address.City).Contains(normLocation))
                .ToList();
        }

        var matchingPitches = activePitches
            .Select(p => new
            {
                Pitch = p,
                AvailableSlots = p.TimeSlots
                    .Where(ts => IsSlotAvailable(ts, parsed.TargetDate, parsed.RequestedTime, parsed.StartTimeRange, parsed.EndTimeRange))
                    .OrderBy(ts => ts.TimeRange.StartTime)
                    .ToList()
            })
            .Where(item => item.AvailableSlots.Any())
            .ToList();

        // 4. Formulate the SYSTEM_DATA section
        var systemDataBuilder = new StringBuilder();
        if (matchingPitches.Any())
        {
            systemDataBuilder.AppendLine("Dưới đây là danh sách các sân còn trống lịch phù hợp với tìm kiếm:");
            foreach (var item in matchingPitches)
            {
                var slotsText = string.Join("; ", item.AvailableSlots.Select(ts =>
                    $"{ts.TimeRange.StartTime:hh\\:mm} - {ts.TimeRange.EndTime:hh\\:mm} (Giá: {ts.Price.Amount:N0} VND)"));

                systemDataBuilder.AppendLine($"- Sân: {item.Pitch.Name}");
                systemDataBuilder.AppendLine($"  + Địa chỉ: {item.Pitch.SportCenter.Address.GetFullAddress()}");
                systemDataBuilder.AppendLine($"  + Loại môn: {GetSportLabel(item.Pitch.Type)}");
                systemDataBuilder.AppendLine($"  + Khung giờ trống: {slotsText}");
            }
        }
        else
        {
            systemDataBuilder.AppendLine("Không tìm thấy sân trống nào phù hợp với yêu cầu tìm kiếm của người dùng trong hệ thống hiện tại.");
        }

        if (parsed.IsAmbiguousTime)
        {
            systemDataBuilder.AppendLine("\nLƯU Ý QUAN TRỌNG: Người dùng yêu cầu khung giờ mập mờ (ví dụ chỉ nói \"7h\" mà không rõ sáng hay tối). Vui lòng hỏi lại người dùng để làm rõ họ muốn chơi lúc 7h sáng hay 7h tối (19h).");
        }

        // 5. Construct Prompt
        var formattedCurrentDateTime = hcmNow.ToString("dd/MM/yyyy HH:mm:ss", CultureInfo.InvariantCulture);
        var prompt = $@"Bạn là SmartSport AI Assistant.
Chỉ trả lời các câu hỏi liên quan đến hệ thống đặt sân SmartSport.
Không tự tạo dữ liệu.
Chỉ sử dụng dữ liệu trong phần THÔNG TIN HỆ THỐNG.

THỜI GIAN HIỆN TẠI:
{formattedCurrentDateTime}
Múi giờ: Asia/Ho_Chi_Minh

THÔNG TIN HỆ THỐNG:
{systemDataBuilder}

CÂU HỎI NGƯỜI DÙNG:
{request.Message}

Yêu cầu trả lời:
- Trả lời bằng tiếng Việt.
- Ngắn gọn, tự nhiên, dễ hiểu.
- Nếu có sân trống, nêu tên sân, địa chỉ, khung giờ, giá.
- Nếu thiếu thông tin, hỏi lại người dùng.
- Nếu không có sân trống, nói rõ không có sân phù hợp.
- Không trả lời ngoài phạm vi SmartSport.";

        // 6. Generate Response
        string answer;
        try
        {
            answer = await _geminiService.GenerateChatResponseAsync(prompt);
        }
        catch (Exception ex)
        {
            answer = "Tôi chưa có đủ dữ liệu để trả lời chính xác. Vui lòng kiểm tra trên hệ thống hoặc liên hệ chủ sân.";
        }

        // 7. Suggestions list
        var suggestions = new List<string>();
        if (parsed.SportType.HasValue)
        {
            var label = GetSportLabel(parsed.SportType.Value);
            suggestions.Add($"Tìm sân {label} ngày mai");
            suggestions.Add($"Giá thuê sân {label} khoảng bao nhiêu?");
        }
        else
        {
            suggestions.Add("Tìm sân cầu lông tối nay");
            suggestions.Add("Tìm sân bóng đá ngày mai");
        }
        suggestions.Add("Hướng dẫn cách thanh toán cọc");

        return new AskChatbotResponse
        {
            Answer = answer,
            Suggestions = suggestions
        };
    }

    private static bool IsSlotAvailable(TimeSlot slot, DateOnly targetDate, TimeSpan? requestedTime, TimeSpan? startTimeRange, TimeSpan? endTimeRange)
    {
        if (!slot.IsActive) return false;

        // Filter by specific requested time if set
        if (requestedTime.HasValue && !slot.TimeRange.Contains(requestedTime.Value))
        {
            return false;
        }

        // Filter by time range if set (e.g. "tối nay" range 18:00 - 22:00)
        if (startTimeRange.HasValue && endTimeRange.HasValue)
        {
            if (slot.TimeRange.StartTime < startTimeRange.Value || slot.TimeRange.StartTime >= endTimeRange.Value)
            {
                return false;
            }
        }

        // Check if there is any overlapping booking that is not cancelled or no-show
        var hasBooking = slot.Bookings.Any(booking =>
            booking.BookingDate == targetDate &&
            booking.Status != BookingStatus.Cancelled &&
            booking.Status != BookingStatus.NoShow);

        return !hasBooking;
    }

    private static bool SportMatchesCriteria(PitchType pitchType, PitchType requestedType)
    {
        if (requestedType == PitchType.Football5)
        {
            return pitchType is PitchType.Football5 or PitchType.Football7 or PitchType.Football11;
        }
        return pitchType == requestedType;
    }

    private static string GetSportLabel(PitchType type)
    {
        return type switch
        {
            PitchType.Football5 => "Bóng đá sân 5",
            PitchType.Football7 => "Bóng đá sân 7",
            PitchType.Football11 => "Bóng đá sân 11",
            PitchType.Badminton => "Cầu lông",
            PitchType.Tennis => "Tennis",
            PitchType.Pickleball => "Pickleball",
            PitchType.Basketball => "Bóng rổ",
            PitchType.Volleyball => "Bóng chuyền",
            PitchType.TableTennis => "Bóng bàn",
            _ => type.ToString()
        };
    }

    private static string NormalizeText(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
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

    private sealed class ParsedQuery
    {
        public PitchType? SportType { get; set; }
        public DateOnly TargetDate { get; set; }
        public TimeSpan? RequestedTime { get; set; }
        public TimeSpan? StartTimeRange { get; set; }
        public TimeSpan? EndTimeRange { get; set; }
        public bool IsAmbiguousTime { get; set; }
        public string? Location { get; set; }
    }

    private static ParsedQuery ParseQuery(string message, DateTime hcmNow)
    {
        var normalized = NormalizeText(message);
        var parsed = new ParsedQuery
        {
            TargetDate = DateOnly.FromDateTime(hcmNow)
        };

        // 1. Parse Sport Type
        if (normalized.Contains("cau long") || normalized.Contains("badminton")) parsed.SportType = PitchType.Badminton;
        else if (normalized.Contains("tennis")) parsed.SportType = PitchType.Tennis;
        else if (normalized.Contains("pickleball")) parsed.SportType = PitchType.Pickleball;
        else if (normalized.Contains("bong ro") || normalized.Contains("basketball")) parsed.SportType = PitchType.Basketball;
        else if (normalized.Contains("bong chuyen") || normalized.Contains("volleyball")) parsed.SportType = PitchType.Volleyball;
        else if (normalized.Contains("bong ban") || normalized.Contains("table tennis")) parsed.SportType = PitchType.TableTennis;
        else if (normalized.Contains("san 11")) parsed.SportType = PitchType.Football11;
        else if (normalized.Contains("san 7")) parsed.SportType = PitchType.Football7;
        else if (normalized.Contains("bong da") || normalized.Contains("football") || normalized.Contains("san 5")) parsed.SportType = PitchType.Football5;

        // 2. Parse Date
        if (normalized.Contains("ngay mai") || normalized.Contains("mai"))
        {
            parsed.TargetDate = DateOnly.FromDateTime(hcmNow.AddDays(1));
        }

        // 3. Parse Time / Time Range
        if (normalized.Contains("toi nay"))
        {
            parsed.StartTimeRange = new TimeSpan(18, 0, 0);
            parsed.EndTimeRange = new TimeSpan(22, 0, 0);
        }

        // Parse patterns like "7h toi", "7h sang", "7h", "19h", "18h30", "19:00", "7 gio"
        var match = Regex.Match(normalized, @"\b(\d{1,2})(?:h|:|\s*gio|\s*gio)?\s*(\d{2})?\b");
        if (match.Success)
        {
            if (int.TryParse(match.Groups[1].Value, out int hour))
            {
                int minute = 0;
                if (match.Groups[2].Success)
                {
                    int.TryParse(match.Groups[2].Value, out minute);
                }

                if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)
                {
                    bool hasPMIndicator = normalized.Contains("toi") || normalized.Contains("tối") || normalized.Contains("chieu") || normalized.Contains("chiều") || normalized.Contains("dem") || normalized.Contains("đêm");
                    bool hasAMIndicator = normalized.Contains("sang") || normalized.Contains("sáng");

                    if (hour <= 12)
                    {
                        if (!hasPMIndicator && !hasAMIndicator)
                        {
                            // Ambiguous time: E.g., user said "7h" without am/pm
                            parsed.IsAmbiguousTime = true;
                            parsed.RequestedTime = new TimeSpan(hour, minute, 0);
                        }
                        else
                        {
                            if (hasPMIndicator && hour < 12)
                            {
                                hour += 12;
                            }
                            parsed.RequestedTime = new TimeSpan(hour, minute, 0);
                        }
                    }
                    else
                    {
                        parsed.RequestedTime = new TimeSpan(hour, minute, 0);
                    }
                }
            }
        }

        // 4. Parse Location keywords (e.g. "quan 1", "quan 7", "binh thanh", etc.)
        var locationMatch = Regex.Match(normalized, @"\b(quan\s*\d+|quan\s*[a-z]+|binh thanh|thu duc|tan binh|phu nhuan|tan phu|binh tan|go vap)\b");
        if (locationMatch.Success)
        {
            parsed.Location = locationMatch.Value;
        }

        return parsed;
    }
}
