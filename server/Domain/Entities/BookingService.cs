using Domain.Common;
using Domain.Exceptions;
using Domain.ValueObjects;

namespace Domain.Entities;

public class BookingService : BaseEntity
{
    private const int MaxServiceNameLength = 100;

    private BookingService() { }

    private BookingService(Guid bookingId, Guid serviceId, string serviceName, Money price, int quantity, string? addedByName)
    {
        BookingId = bookingId;
        ServiceId = serviceId;
        ServiceName = serviceName;
        Price = price;
        Quantity = quantity;
        AddedByName = addedByName;
    }

    public Guid BookingId { get; private set; }
    public Booking Booking { get; private set; } = null!;
    
    public Guid ServiceId { get; private set; }
    public AdditionalService Service { get; private set; } = null!;

    public string ServiceName { get; private set; } = string.Empty;
    public Money Price { get; private set; } = null!;
    public int Quantity { get; private set; }
    public string? AddedByName { get; private set; }

    public static BookingService Create(Guid bookingId, Guid serviceId, string serviceName, Money price, int quantity = 1, string? addedByName = null)
    {
        ValidateCreationParameters(bookingId, serviceId, serviceName, price, quantity);
        return new BookingService(bookingId, serviceId, serviceName, price, quantity, addedByName);
    }

    private static void ValidateCreationParameters(Guid bookingId, Guid serviceId, string serviceName, Money price, int quantity)
    {
        if (bookingId == Guid.Empty)
            throw new DomainException("Booking ID is required");

        if (serviceId == Guid.Empty)
            throw new DomainException("Service ID is required");

        if (string.IsNullOrWhiteSpace(serviceName))
            throw new DomainException("Service name is required");

        if (serviceName.Length > MaxServiceNameLength)
            throw new DomainException($"Service name cannot exceed {MaxServiceNameLength} characters");

        if (price is null)
            throw new DomainException("Service price is required");

        if (price.Amount < 0)
            throw new DomainException("Service price cannot be negative");

        if (quantity <= 0)
            throw new DomainException("Service quantity must be greater than zero");
    }
}
