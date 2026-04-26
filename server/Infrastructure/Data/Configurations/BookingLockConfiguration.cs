using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class BookingLockConfiguration : IEntityTypeConfiguration<BookingLock>
{
    public void Configure(EntityTypeBuilder<BookingLock> builder)
    {
        builder.ToTable("BookingLocks");

        builder.HasKey(bl => bl.Id);

        builder.Property(bl => bl.TimeSlotId)
            .IsRequired();

        builder.Property(bl => bl.BookingDate)
            .IsRequired();

        builder.Property(bl => bl.UserId)
            .IsRequired();

        builder.Property(bl => bl.LockedAt)
            .IsRequired();

        builder.Property(bl => bl.ExpiresAt)
            .IsRequired();

        builder.Property(bl => bl.IsReleased)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(bl => bl.CreatedAt)
            .IsRequired();

        builder.Property(bl => bl.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        // Indexes for performance
        builder.HasIndex(bl => new { bl.TimeSlotId, bl.BookingDate, bl.IsReleased, bl.ExpiresAt })
            .HasDatabaseName("IX_BookingLocks_TimeSlot_Date_Status");

        builder.HasIndex(bl => bl.UserId);
        builder.HasIndex(bl => bl.ExpiresAt);

        builder.HasQueryFilter(bl => !bl.IsDeleted);
    }
}
