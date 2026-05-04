using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Pitch> Pitches { get; }
    DbSet<TimeSlot> TimeSlots { get; }
    DbSet<Booking> Bookings { get; }
    DbSet<PaymentTransaction> PaymentTransactions { get; }
    DbSet<PitchImage> PitchImages { get; }
    DbSet<BookingLock> BookingLocks { get; }
    DbSet<UserPreference> UserPreferences { get; }
    DbSet<ChatConversation> ChatConversations { get; }
    DbSet<Review> Reviews { get; }
    DbSet<WaitlistEntry> WaitlistEntries { get; }
    DbSet<Notification> Notifications { get; }

    DatabaseFacade Database { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
