using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class WaitlistEntryConfiguration : IEntityTypeConfiguration<WaitlistEntry>
{
    public void Configure(EntityTypeBuilder<WaitlistEntry> builder)
    {
        builder.HasKey(w => w.Id);

        builder.Property(w => w.UserId)
            .IsRequired();

        builder.Property(w => w.TimeSlotId)
            .IsRequired();

        builder.Property(w => w.BookingDate)
            .IsRequired();

        builder.Property(w => w.Status)
            .IsRequired();

        // Index for faster searching when a booking is cancelled
        builder.HasIndex(w => new { w.TimeSlotId, w.BookingDate, w.Status });

        builder.HasOne(w => w.User)
            .WithMany()
            .HasForeignKey(w => w.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(w => w.TimeSlot)
            .WithMany()
            .HasForeignKey(w => w.TimeSlotId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
