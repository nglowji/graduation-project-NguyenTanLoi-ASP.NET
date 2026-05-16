using Domain.Entities;
using Domain.Exceptions;
using Domain.ValueObjects;

namespace Domain.Services;

public sealed record BookingServicePricing(Money UnitPrice, int Quantity);

public sealed record BookingPrice(
    Money TimeSlotPrice,
    Money ServicesTotal,
    Money TotalPrice,
    Money DepositAmount);

public class PricingDomainService
{
    private const decimal MinDepositPercentage = 0m;
    private const decimal MaxDepositPercentage = 100m;

    // Peak hours: 17:00 - 21:00 (+30%)
    private static readonly TimeSpan PeakStart = TimeSpan.FromHours(17);
    private static readonly TimeSpan PeakEnd = TimeSpan.FromHours(21);
    private const decimal PeakMultiplier = 1.3m;

    // Off-peak hours: 22:00 - 05:00 (-20%)
    private static readonly TimeSpan OffPeakStart = TimeSpan.FromHours(22);
    private static readonly TimeSpan OffPeakEnd = TimeSpan.FromHours(5);
    private const decimal OffPeakMultiplier = 0.8m;

    // Weekend: Saturday & Sunday (+10%)
    private const decimal WeekendMultiplier = 1.1m;

    public Money CalculateEffectivePrice(TimeSlot timeSlot, DateOnly date)
    {
        var basePrice = timeSlot.Price;
        var multiplier = 1.0m;

        // 1. Check for Peak/Off-peak hours
        var startTime = timeSlot.TimeRange.StartTime;
        
        if (IsPeakHour(startTime))
        {
            multiplier *= PeakMultiplier;
        }
        else if (IsOffPeakHour(startTime))
        {
            multiplier *= OffPeakMultiplier;
        }

        // 2. Check for Weekend
        if (IsWeekend(date))
        {
            multiplier *= WeekendMultiplier;
        }

        if (multiplier == 1.0m)
            return basePrice;

        return Money.Create(Math.Round(basePrice.Amount * multiplier, 0), basePrice.Currency);
    }

    public BookingPrice CalculateBookingPrice(
        TimeSlot timeSlot,
        DateOnly date,
        IEnumerable<BookingServicePricing>? selectedServices,
        decimal depositPercentage)
    {
        if (timeSlot is null)
            throw new DomainException("Time slot is required");

        ValidateDepositPercentage(depositPercentage);

        var timeSlotPrice = CalculateEffectivePrice(timeSlot, date);
        var servicesTotal = CalculateServicesTotal(selectedServices, timeSlotPrice.Currency);
        var totalPrice = timeSlotPrice.Add(servicesTotal);
        var depositAmount = totalPrice.CalculatePercentage(depositPercentage);

        return new BookingPrice(timeSlotPrice, servicesTotal, totalPrice, depositAmount);
    }

    private static bool IsPeakHour(TimeSpan time)
    {
        return time >= PeakStart && time < PeakEnd;
    }

    private static bool IsOffPeakHour(TimeSpan time)
    {
        // Off-peak: 22:00 - 23:59 or 00:00 - 05:00
        return time >= OffPeakStart || time < OffPeakEnd;
    }

    private static bool IsWeekend(DateOnly date)
    {
        var dayOfWeek = date.DayOfWeek;
        return dayOfWeek == DayOfWeek.Saturday || dayOfWeek == DayOfWeek.Sunday;
    }

    private static Money CalculateServicesTotal(
        IEnumerable<BookingServicePricing>? selectedServices,
        string currency)
    {
        var total = Money.Zero(currency);

        if (selectedServices is null)
            return total;

        foreach (var selectedService in selectedServices)
        {
            if (selectedService.UnitPrice is null)
                throw new DomainException("Service price is required");

            if (selectedService.Quantity <= 0)
                throw new DomainException("Service quantity must be greater than zero");

            total = total.Add(selectedService.UnitPrice.Multiply(selectedService.Quantity));
        }

        return total;
    }

    private static void ValidateDepositPercentage(decimal depositPercentage)
    {
        if (depositPercentage < MinDepositPercentage || depositPercentage > MaxDepositPercentage)
            throw new DomainException($"Deposit percentage must be between {MinDepositPercentage} and {MaxDepositPercentage}");
    }
}
