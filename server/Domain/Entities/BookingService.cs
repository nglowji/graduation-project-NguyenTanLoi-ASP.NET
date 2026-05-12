using Domain.Common;
using Domain.ValueObjects;

namespace Domain.Entities;

public class BookingService : BaseEntity
{
    private BookingService() { }

    private BookingService(Guid bookingId, Guid serviceId, string serviceName, Money price, int quantity)
    {
        BookingId = bookingId;
        ServiceId = serviceId;
        ServiceName = serviceName;
        Price = price;
        Quantity = quantity;
    }

    public Guid BookingId { get; private set; }
    public Booking Booking { get; private set; } = null!;
    
    public Guid ServiceId { get; private set; }
    public AdditionalService Service { get; private set; } = null!;

    public string ServiceName { get; private set; } = string.Empty;
    public Money Price { get; private set; } = null!;
    public int Quantity { get; private set; }

    public static BookingService Create(Guid bookingId, Guid serviceId, string serviceName, Money price, int quantity = 1)
    {
        return new BookingService(bookingId, serviceId, serviceName, price, quantity);
    }
}
