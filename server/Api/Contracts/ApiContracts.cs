namespace Api.Contracts;

// ── Auth ──────────────────────────────────────────────
public record UserProfileDto(
    Guid Id,
    string Email,
    string FullName,
    string PhoneNumber,
    string Role,
    bool IsActive,
    DateTime? LastLoginAt
);

public record GoogleLoginRequest(string AccessToken);

public record FacebookLoginRequest(string AccessToken);

// ── Admin ─────────────────────────────────────────────
public record AdminCreateUserRequest(
    string FullName,
    string Email,
    string PhoneNumber,
    string Password,
    int Role,
    string? Address = null
);

// ── Owner Staff ───────────────────────────────────────
public record OwnerCreateStaffRequest(
    string FullName,
    string Email,
    string PhoneNumber,
    string Password
);

// ── Bookings ──────────────────────────────────────────
public record LockTimeSlotRequest(
    Guid TimeSlotId,
    DateOnly BookingDate,
    int LockDurationMinutes = 10
);

public record CreateBookingRequest(
    Guid TimeSlotId,
    DateOnly BookingDate,
    List<Application.Features.Bookings.Commands.CreateBooking.BookingServiceRequest>? SelectedServices = null
);

public record CancelBookingRequest(string Reason);

// ── Payments ──────────────────────────────────────────
public record CreatePaymentRequest(
    Guid BookingId,
    string ReturnUrl
);

public record CreatePaymentResponse(string PaymentUrl);

// ── Reviews ───────────────────────────────────────────
public record CreateReviewRequest(
    int Rating,
    string? Comment
);

public record ReplyReviewRequest(string Content);

// ── Waitlist ──────────────────────────────────────────
public record JoinWaitlistRequest(
    Guid TimeSlotId,
    DateOnly Date
);

// ── AI ────────────────────────────────────────────────
public record ChatRequest
{
    public string Message { get; init; } = null!;
    public string? SessionId { get; init; }
}
