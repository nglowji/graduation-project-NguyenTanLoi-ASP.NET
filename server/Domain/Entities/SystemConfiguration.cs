using Domain.Common;
using Domain.Exceptions;

namespace Domain.Entities;

public class SystemConfiguration : BaseEntity
{
    private const decimal MinDepositPercentage = 0m;
    private const decimal MaxDepositPercentage = 100m;
    private const int MinCancellationHours = 0;
    private const int MaxCancellationHours = 168; // 7 days

    private SystemConfiguration() { } // EF Core constructor

    private SystemConfiguration(string key, string value, string? description)
    {
        Key = key;
        Value = value;
        Description = description;
    }

    public string Key { get; private set; } = string.Empty;
    public string Value { get; private set; } = string.Empty;
    public string? Description { get; private set; }

    public static SystemConfiguration Create(string key, string value, string? description = null)
    {
        ValidateKey(key);
        ValidateValue(value);

        return new SystemConfiguration(key, value, description);
    }

    public void UpdateValue(string newValue)
    {
        ValidateValue(newValue);
        Value = newValue;
        MarkAsUpdated();
    }

    public decimal GetDecimalValue()
    {
        if (!decimal.TryParse(Value, out var result))
            throw new DomainException($"Configuration value '{Value}' is not a valid decimal");

        return result;
    }

    public int GetIntValue()
    {
        if (!int.TryParse(Value, out var result))
            throw new DomainException($"Configuration value '{Value}' is not a valid integer");

        return result;
    }

    public bool GetBoolValue()
    {
        if (!bool.TryParse(Value, out var result))
            throw new DomainException($"Configuration value '{Value}' is not a valid boolean");

        return result;
    }

    private static void ValidateKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new DomainException("Configuration key is required");
    }

    private static void ValidateValue(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Configuration value is required");
    }

    // Predefined configuration keys
    public static class Keys
    {
        public const string DepositPercentage = "DepositPercentage";
        public const string MinimumCancellationHours = "MinimumCancellationHours";
        public const string PlatformCommissionPercentage = "PlatformCommissionPercentage";
        public const string MaxBookingsPerUser = "MaxBookingsPerUser";
    }
}
