using Application.Common.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using System.Data.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SystemConfigurationRepository : BaseRepository<SystemConfiguration>, ISystemConfigurationRepository
{
    public SystemConfigurationRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<SystemConfiguration?> GetByKeyAsync(string key, CancellationToken cancellationToken = default)
    {
        return await _context.Set<SystemConfiguration>()
            .FirstOrDefaultAsync(c => c.Key == key, cancellationToken);
    }

    public async Task<string> GetValueAsync(string key, string defaultValue, CancellationToken cancellationToken = default)
    {
        try
        {
            var config = await GetByKeyAsync(key, cancellationToken);
            return config?.Value ?? defaultValue;
        }
        catch (InvalidOperationException)
        {
            return defaultValue;
        }
        catch (DbException)
        {
            return defaultValue;
        }
    }
}
