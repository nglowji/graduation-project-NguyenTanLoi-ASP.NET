using Domain.Common;
using Domain.Exceptions;
using Domain.ValueObjects;

namespace Domain.Entities;

public class AdditionalService : BaseEntity
{
    private const int MaxNameLength = 100;
    private const int MaxIconLength = 50;

    private AdditionalService() { } // EF Core constructor

    private AdditionalService(Guid sportCenterId, string name, Money price, string icon, int stockQuantity, string? imageUrl)
    {
        SportCenterId = sportCenterId;
        Name = name;
        Price = price;
        Icon = icon;
        StockQuantity = stockQuantity;
        ImageUrl = imageUrl;
        IsActive = true;
    }

    public Guid SportCenterId { get; private set; }
    public SportCenter SportCenter { get; private set; } = null!;
    public string Name { get; private set; } = string.Empty;
    public Money Price { get; private set; } = null!;
    public string Icon { get; private set; } = string.Empty;
    public string? ImageUrl { get; private set; }
    public int StockQuantity { get; private set; }
    public bool IsActive { get; private set; }

    public static AdditionalService Create(Guid sportCenterId, string name, Money price, string icon, int stockQuantity, string? imageUrl)
    {
        ValidateCreationParameters(sportCenterId, name, price, icon, stockQuantity);
        return new AdditionalService(sportCenterId, name, price, icon, stockQuantity, imageUrl);
    }

    public void Update(string name, Money price, string icon, int stockQuantity, string? imageUrl)
    {
        ValidateName(name);
        ValidatePrice(price);
        ValidateIcon(icon);
        ValidateStock(stockQuantity);

        Name = name;
        Price = price;
        Icon = icon;
        StockQuantity = stockQuantity;
        ImageUrl = imageUrl;
        MarkAsUpdated();
    }

    public void ToggleActive(bool isActive)
    {
        IsActive = isActive;
        MarkAsUpdated();
    }

    private static void ValidateCreationParameters(Guid sportCenterId, string name, Money price, string icon, int stockQuantity)
    {
        if (sportCenterId == Guid.Empty)
            throw new DomainException("Sport Center ID is required");

        ValidateName(name);
        ValidatePrice(price);
        ValidateIcon(icon);
        ValidateStock(stockQuantity);
    }

    private static void ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Service name is required");

        if (name.Length > MaxNameLength)
            throw new DomainException($"Service name cannot exceed {MaxNameLength} characters");
    }

    private static void ValidateIcon(string icon)
    {
        if (string.IsNullOrWhiteSpace(icon))
            throw new DomainException("Icon is required");

        if (icon.Length > MaxIconLength)
            throw new DomainException($"Icon cannot exceed {MaxIconLength} characters");
    }

    private static void ValidatePrice(Money price)
    {
        if (!price.IsPositive && price.Amount < 0)
            throw new DomainException("Price cannot be negative");
    }

    private static void ValidateStock(int stock)
    {
        if (stock < 0)
            throw new DomainException("Stock quantity cannot be negative");
    }
}
