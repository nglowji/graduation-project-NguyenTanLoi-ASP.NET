using Domain.Entities;

namespace Application.Common.Interfaces;

public interface ISystemConfigurationRepository : IRepository<SystemConfiguration>
{
    Task<SystemConfiguration?> GetByKeyAsync(string key, CancellationToken cancellationToken = default);
    Task<string> GetValueAsync(string key, string defaultValue, CancellationToken cancellationToken = default);
}
