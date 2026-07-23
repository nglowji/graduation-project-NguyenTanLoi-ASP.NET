namespace Application.Common.Interfaces;

public sealed record SystemSettingDto(string Key, string Value, string? Description);

public interface ISystemSettingService
{
    Task<decimal> GetDecimalAsync(
        string key,
        decimal defaultValue,
        decimal minValue,
        decimal maxValue,
        CancellationToken cancellationToken = default);

    Task<int> GetIntAsync(
        string key,
        int defaultValue,
        int minValue,
        int maxValue,
        CancellationToken cancellationToken = default);

    Task<SystemSettingDto> UpsertDecimalAsync(
        string key,
        decimal value,
        decimal minValue,
        decimal maxValue,
        string description,
        CancellationToken cancellationToken = default);

    Task<SystemSettingDto> UpsertIntAsync(
        string key,
        int value,
        int minValue,
        int maxValue,
        string description,
        CancellationToken cancellationToken = default);
}
