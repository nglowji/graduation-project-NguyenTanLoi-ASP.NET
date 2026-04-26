using Application.Common.Models;
using Domain.Entities;
using Domain.Enums;

namespace Application.Common.Interfaces;

public interface IBookingRepository : IRepository<Booking>
{
    Task<PagedResult<Booking>> GetByUserIdAsync(
        Guid userId, 
        int pageNumber, 
        int pageSize,
        BookingStatus? status = null,
        CancellationToken cancellationToken = default);
    
    Task<IReadOnlyList<Booking>> GetByTimeSlotAndDateAsync(
        Guid timeSlotId, 
        DateOnly date,
        CancellationToken cancellationToken = default);
    
    Task<bool> IsTimeSlotAvailableAsync(
        Guid timeSlotId, 
        DateOnly date,
        CancellationToken cancellationToken = default);
    
    Task<Booking?> GetWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
}
