using Domain.Entities;

namespace Application.Common.Interfaces;

public interface IReviewRepository : IRepository<Review>
{
    Task<bool> HasUserReviewedBookingAsync(Guid bookingId, CancellationToken cancellationToken = default);
    Task<List<Review>> GetByPitchIdAsync(Guid pitchId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<int> GetTotalCountByPitchIdAsync(Guid pitchId, CancellationToken cancellationToken = default);
}
