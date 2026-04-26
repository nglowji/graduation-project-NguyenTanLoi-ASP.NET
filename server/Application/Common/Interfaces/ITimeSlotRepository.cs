using Domain.Entities;

namespace Application.Common.Interfaces;

public interface ITimeSlotRepository
{
    Task<TimeSlot?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TimeSlot>> GetByPitchIdAsync(Guid pitchId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TimeSlot>> GetAvailableByPitchIdAsync(Guid pitchId, DateOnly date, CancellationToken cancellationToken = default);
}
