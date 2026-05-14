using Application.Common.Interfaces;
using Domain.Entities;
using MongoDB.Driver;

namespace Infrastructure.Repositories;

public class SystemLogRepository : ISystemLogRepository
{
    private readonly IMongoCollection<SystemLog> _collection;

    public SystemLogRepository(IMongoDbContext context)
    {
        _collection = context.GetCollection<SystemLog>("SystemLogs");
    }

    public async Task AddLogAsync(SystemLog log)
    {
        await _collection.InsertOneAsync(log);
    }

    public async Task<List<SystemLog>> GetLogsAsync(int limit = 100)
    {
        return await _collection.Find(_ => true)
            .SortByDescending(l => l.Timestamp)
            .Limit(limit)
            .ToListAsync();
    }
}
