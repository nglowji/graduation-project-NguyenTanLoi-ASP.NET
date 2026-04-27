using Domain.Entities;

namespace Application.Common.Interfaces;

public interface IUserPreferenceRepository
{
    Task<UserPreference?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserPreference> CreateAsync(UserPreference preference, CancellationToken cancellationToken = default);
    Task UpdateAsync(UserPreference preference, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid userId, CancellationToken cancellationToken = default);
}
