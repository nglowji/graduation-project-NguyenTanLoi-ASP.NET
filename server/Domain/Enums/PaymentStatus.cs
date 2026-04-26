namespace Domain.Enums;

public enum PaymentStatus
{
    Pending = 1,
    Processing = 2,
    Success = 3,
    Failed = 4,
    Refunded = 5,
    PartiallyRefunded = 6
}
