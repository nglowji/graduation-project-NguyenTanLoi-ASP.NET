using Application.Common.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class UserPreferenceRepository : IUserPreferenceRepository
{
    private readonly ApplicationDbContext _context;

    public UserPreferenceRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserPreference?> GetByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<UserPreference>()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
    }

    public async Task<UserPreference> CreateAsync(
        UserPreference preference,
        CancellationToken cancellationToken = default)
    {
        await _context.Set<UserPreference>().AddAsync(preference, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return preference;
    }

    public async Task UpdateAsync(
        UserPreference preference,
        CancellationToken cancellationToken = default)
    {
        _context.Set<UserPreference>().Update(preference);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> ExistsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<UserPreference>()
            .AnyAsync(p => p.UserId == userId, cancellationToken);
    }
}
