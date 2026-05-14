using Domain.Entities;

namespace Application.Common.Interfaces;

public interface ISystemLogRepository
{
    Task AddLogAsync(SystemLog log);
    Task<List<SystemLog>> GetLogsAsync(int limit = 100);
}
