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
    
    /// <summary>
    /// Kiểm tra sự tồn tại của sân theo ID
    /// </summary>
    Task<bool> ExistsAsync(
        Guid id, 
        CancellationToken cancellationToken = default);
    
    Task<IReadOnlyList<Pitch>> GetByOwnerIdAsync(
        Guid ownerId, 
        CancellationToken cancellationToken = default);
    
    Task<IReadOnlyList<Pitch>> SearchNearbyAsync(
        double latitude, 
        double longitude, 
        double radiusKm,
        PitchType? type = null,
        CancellationToken cancellationToken = default);
    
    Task<Pitch?> GetWithTimeSlotsAsync(
        Guid id, 
        CancellationToken cancellationToken = default);

    Task<PagedResult<Pitch>> SearchAsync(
        string? searchTerm,
        PitchType? type,
        decimal? minPrice,
        decimal? maxPrice,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);
}
