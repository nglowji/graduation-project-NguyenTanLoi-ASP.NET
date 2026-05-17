using System.Globalization;
using System.Text;
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
        var conversation = await _conversationRepository.GetBySessionIdAsync(sessionId, cancellationToken);

        if (conversation == null)
        {
            conversation = Domain.Entities.ChatConversation.Create(request.UserId, sessionId);
            await _conversationRepository.CreateAsync(conversation, cancellationToken);
        }

        conversation.AddMessage("user", request.Message);

        var context = await BuildConversationContextAsync(request.UserId, conversation, cancellationToken);
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

    private async Task<string> BuildConversationContextAsync(
        Guid userId,
        Domain.Entities.ChatConversation conversation,
        CancellationToken cancellationToken)
    {
        var recentMessages = conversation.Messages
            .TakeLast(10)
            .Select(m => $"{m.Role}: {m.Content}")
            .ToList();

        var builder = new StringBuilder();
        builder.AppendLine("SMARTSPORT_SYSTEM_DATA:");
        builder.AppendLine("- SmartSport là nền tảng đặt sân thể thao. Người chơi tìm sân, chọn khung giờ, thanh toán cọc 10% qua VNPAY, nhận mã check-in và thanh toán phần còn lại theo chính sách chủ sân.");
        builder.AppendLine("- Các vai trò chính: Customer đặt sân; PitchOwner quản lý sân, booking, doanh thu; Staff hỗ trợ chủ sân; Admin duyệt sân, quản lý người dùng và báo cáo hoa hồng.");
        builder.AppendLine("- Trạng thái booking: PendingDeposit là chờ cọc; Confirmed là đã xác nhận; Completed là hoàn thành; Cancelled là đã hủy; NoShow là không đến sân.");
        builder.AppendLine("- Nếu không có dữ liệu chắc chắn, hãy nói rõ là chưa có dữ liệu trong hệ thống thay vì bịa.");

        if (_context != null)
        {
            var activePitches = await _context.Pitches
                .AsNoTracking()
                .Include(p => p.SportCenter)
                .Include(p => p.TimeSlots)
                .Where(p => p.Status == PitchStatus.Active)
                .OrderByDescending(p => p.AverageRating)
                .ThenBy(p => p.Name)
                .Take(16)
                .ToListAsync(cancellationToken);

            var totalUsers = await _context.Users.AsNoTracking().CountAsync(cancellationToken);
            var activeOwners = await _context.Users.AsNoTracking().CountAsync(u => u.Role == UserRole.PitchOwner && u.IsActive, cancellationToken);
            var totalActivePitches = await _context.Pitches.AsNoTracking().CountAsync(p => p.Status == PitchStatus.Active, cancellationToken);
            var sportTypes = activePitches
                .GroupBy(p => p.Type)
                .Select(g => $"{GetSportLabel(g.Key)}: {g.Count()}")
                .ToList();

            builder.AppendLine($"- Snapshot hiện tại: {totalUsers} người dùng, {activeOwners} chủ sân hoạt động, {totalActivePitches} sân đang hoạt động.");
            if (sportTypes.Any())
            {
                builder.AppendLine($"- Loại sân đang có trong mẫu dữ liệu: {string.Join("; ", sportTypes)}.");
            }

            if (activePitches.Any())
            {
                builder.AppendLine("- Một số sân thật đang hoạt động để tham khảo khi tư vấn:");
                foreach (var pitch in activePitches)
                {
                    var minPrice = pitch.TimeSlots
                        .Where(ts => ts.IsActive)
                        .Select(ts => ts.Price.Amount)
                        .DefaultIfEmpty()
                        .Where(price => price > 0)
                        .Cast<decimal?>()
                        .Min();

                    builder.AppendLine(
                        $"  + {pitch.Name}; môn {GetSportLabel(pitch.Type)}; " +
                        $"giá từ {(minPrice.HasValue ? $"{minPrice:N0} VND" : "chưa có giá")}; " +
                        $"rating {pitch.AverageRating:0.0}/5; " +
                        $"{(pitch.IsIndoor ? "trong nhà" : "ngoài trời")}; " +
                        $"địa chỉ {pitch.SportCenter?.Address?.GetFullAddress() ?? "chưa cập nhật"}.");
                }
            }
        }

        var recentBookings = await _bookingRepository.GetByUserIdAsync(userId, 1, 5, null, cancellationToken);
        if (recentBookings.Items.Any())
        {
            builder.AppendLine("- Lịch sử đặt sân gần đây của người dùng:");
            foreach (var booking in recentBookings.Items)
            {
                builder.AppendLine(
                    $"  + {booking.BookingDate:yyyy-MM-dd}; " +
                    $"{booking.TimeSlot?.Pitch?.Name ?? "Sân"}; " +
                    $"{booking.TotalPrice.Amount:N0} VND; trạng thái {booking.Status}.");
            }
        }
        else
        {
            builder.AppendLine("- Người dùng chưa có lịch sử đặt sân gần đây trong hệ thống.");
        }

        builder.AppendLine();
        builder.AppendLine("RECENT_CONVERSATION:");
        builder.AppendLine(string.Join("\n", recentMessages));

        return builder.ToString();
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
