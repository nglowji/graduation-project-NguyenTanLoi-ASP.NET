using Domain.Enums;

namespace Application.Features.Bookings.DTOs;

public class BookingDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid TimeSlotId { get; set; }
    public DateOnly BookingDate { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal DepositAmount { get; set; }
    public string Currency { get; set; } = "VND";
    public BookingStatus Status { get; set; }
    public string? CancellationReason { get; set; }
    public string? CheckInCode { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public TimeSlotDto? TimeSlot { get; set; }
    public BookingUserDto? User { get; set; }
    public List<BookingServiceDto> Services { get; set; } = new();
}

public class TimeSlotDto
{
    public Guid Id { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = "VND";
    
    public PitchDto? Pitch { get; set; }
}

public class PitchDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
}

public class BookingUserDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
}

public class BookingServiceDto
{
    public Guid Id { get; set; }
    public Guid ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = "VND";
    public int Quantity { get; set; }
    public decimal LineTotal { get; set; }
}
