using System.Globalization;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Exceptions;

namespace Application.Common.Services;

public class SystemSettingService : ISystemSettingService
{
    private readonly ISystemConfigurationRepository _repository;
    private readonly IApplicationDbContext _context;

    public SystemSettingService(
        ISystemConfigurationRepository repository,
        IApplicationDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public async Task<decimal> GetDecimalAsync(
        string key,
        decimal defaultValue,
        decimal minValue,
        decimal maxValue,
        CancellationToken cancellationToken = default)
    {
        var value = await _repository.GetValueAsync(
            key,
            defaultValue.ToString(CultureInfo.InvariantCulture),
            cancellationToken);

        return decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var parsed)
            ? Math.Clamp(parsed, minValue, maxValue)
            : defaultValue;
    }

    public async Task<int> GetIntAsync(
        string key,
        int defaultValue,
        int minValue,
        int maxValue,
        CancellationToken cancellationToken = default)
    {
        var value = await _repository.GetValueAsync(
            key,
            defaultValue.ToString(CultureInfo.InvariantCulture),
            cancellationToken);

        return int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed)
            ? Math.Clamp(parsed, minValue, maxValue)
            : defaultValue;
    }

    public Task<SystemSettingDto> UpsertDecimalAsync(
        string key,
        decimal value,
        decimal minValue,
        decimal maxValue,
        string description,
        CancellationToken cancellationToken = default)
    {
        if (value < minValue || value > maxValue)
            throw new DomainException($"{key} must be between {minValue} and {maxValue}.");

        return UpsertAsync(key, value.ToString("0.##", CultureInfo.InvariantCulture), description, cancellationToken);
    }

    public Task<SystemSettingDto> UpsertIntAsync(
        string key,
        int value,
        int minValue,
        int maxValue,
        string description,
        CancellationToken cancellationToken = default)
    {
        if (value < minValue || value > maxValue)
            throw new DomainException($"{key} must be between {minValue} and {maxValue}.");

        return UpsertAsync(key, value.ToString(CultureInfo.InvariantCulture), description, cancellationToken);
    }

    private async Task<SystemSettingDto> UpsertAsync(
        string key,
        string value,
        string description,
        CancellationToken cancellationToken)
    {
        var config = await _repository.GetByKeyAsync(key, cancellationToken);
        if (config == null)
        {
            config = SystemConfiguration.Create(key, value, description);
            await _repository.AddAsync(config, cancellationToken);
        }
        else
        {
            config.UpdateValue(value);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return new SystemSettingDto(config.Key, config.Value, config.Description);
    }
}
