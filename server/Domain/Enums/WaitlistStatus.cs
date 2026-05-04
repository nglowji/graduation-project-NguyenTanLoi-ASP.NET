namespace Domain.Enums;

public enum WaitlistStatus
{
    Waiting = 1,      // Đang chờ
    Notified = 2,     // Đã được thông báo khi có chỗ trống
    Converted = 3,    // Đã chuyển thành booking thành công
    Expired = 4,      // Hết hạn (qua ngày chơi)
    Cancelled = 5     // Người dùng tự hủy yêu cầu chờ
}
