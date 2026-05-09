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

public record GoogleLoginRequest(string IdToken);

public record FacebookLoginRequest(string AccessToken);

// ── Bookings ──────────────────────────────────────────
public record LockTimeSlotRequest(
    Guid TimeSlotId,
    DateOnly BookingDate,
    int LockDurationMinutes = 10
);

public record CreateBookingRequest(
    Guid TimeSlotId,
    DateOnly BookingDate
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
