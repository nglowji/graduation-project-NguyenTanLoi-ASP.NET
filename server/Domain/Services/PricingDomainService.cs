using Domain.Entities;
using Domain.ValueObjects;

namespace Domain.Services;

public class PricingDomainService
{
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
}
