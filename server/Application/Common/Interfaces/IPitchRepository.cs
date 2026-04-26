using Application.Common.Models;
using Domain.Entities;
using Domain.Enums;

namespace Application.Common.Interfaces;

public interface IPitchRepository : IRepository<Pitch>
{
    Task<PagedResult<Pitch>> GetPagedAsync(
        int pageNumber, 
        int pageSize, 
        PitchType? type = null,
        PitchStatus? status = null,
        CancellationToken cancellationToken = default);
    
    Task<IReadOnlyList<Pitch>> GetByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default);
    
    Task<IReadOnlyList<Pitch>> SearchNearbyAsync(
        double latitude, 
        double longitude, 
        double radiusKm,
        PitchType? type = null,
        CancellationToken cancellationToken = default);
    
    Task<Pitch?> GetWithTimeSlotsAsync(Guid id, CancellationToken cancellationToken = default);
}
