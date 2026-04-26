using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Pitch> Pitches { get; }
    DbSet<TimeSlot> TimeSlots { get; }
    DbSet<Booking> Bookings { get; }
    DbSet<PaymentTransaction> PaymentTransactions { get; }
    DbSet<PitchImage> PitchImages { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
