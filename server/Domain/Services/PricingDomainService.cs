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

    public Money CalculateEffectivePrice(TimeSlot timeSlot, DateOnly date)
    {
        if (timeSlot is null)
            throw new DomainException("Time slot is required");

        return timeSlot.Price;
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
