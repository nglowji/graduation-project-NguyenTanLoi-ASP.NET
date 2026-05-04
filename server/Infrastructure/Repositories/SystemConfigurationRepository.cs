using Application.Common.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SystemConfigurationRepository : ISystemConfigurationRepository
{
    private readonly ApplicationDbContext _context;

    public SystemConfigurationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SystemConfiguration?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Set<SystemConfiguration>().FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<IReadOnlyList<SystemConfiguration>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Set<SystemConfiguration>().AsNoTracking().ToListAsync(cancellationToken);
    }

    public async Task<SystemConfiguration> AddAsync(SystemConfiguration entity, CancellationToken cancellationToken = default)
    {
        await _context.Set<SystemConfiguration>().AddAsync(entity, cancellationToken);
        return entity;
    }

    public Task UpdateAsync(SystemConfiguration entity, CancellationToken cancellationToken = default)
    {
        _context.Set<SystemConfiguration>().Update(entity);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(SystemConfiguration entity, CancellationToken cancellationToken = default)
    {
        _context.Set<SystemConfiguration>().Remove(entity);
        return Task.CompletedTask;
    }

    public async Task<SystemConfiguration?> GetByKeyAsync(string key, CancellationToken cancellationToken = default)
    {
        return await _context.Set<SystemConfiguration>()
            .FirstOrDefaultAsync(c => c.Key == key, cancellationToken);
    }

    public async Task<string> GetValueAsync(string key, string defaultValue, CancellationToken cancellationToken = default)
    {
        var config = await GetByKeyAsync(key, cancellationToken);
        return config?.Value ?? defaultValue;
    }
}
