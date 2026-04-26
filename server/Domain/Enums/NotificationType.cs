namespace Domain.Enums;

public enum NotificationType
{
    BookingCreated = 1,
    BookingConfirmed = 2,
    BookingCancelled = 3,
    BookingCompleted = 4,
    PaymentSuccess = 5,
    PaymentFailed = 6,
    RefundProcessed = 7,
    PitchApproved = 8,
    PitchRejected = 9,
    SystemAnnouncement = 10
}
