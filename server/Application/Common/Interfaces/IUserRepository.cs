using Application.Common.Models;
using Domain.Entities;

namespace Application.Common.Interfaces;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
    Task<PagedResult<User>> GetPagedAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<PagedResult<User>> GetPagedWithFilterAsync(int pageNumber, int pageSize, string? search, int? role, CancellationToken cancellationToken = default);
    Task<int> GetCountByRoleAsync(int role, CancellationToken cancellationToken = default);
}
