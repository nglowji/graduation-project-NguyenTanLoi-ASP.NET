using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TimeSlotConfiguration : IEntityTypeConfiguration<TimeSlot>
{
    public void Configure(EntityTypeBuilder<TimeSlot> builder)
    {
        builder.ToTable("TimeSlots");

        builder.HasKey(ts => ts.Id);

        builder.Property(ts => ts.PitchId)
            .IsRequired();

        builder.Property(ts => ts.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(ts => ts.CreatedAt)
            .IsRequired();

        builder.Property(ts => ts.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.OwnsOne(ts => ts.TimeRange, timeRange =>
        {
            timeRange.Property(tr => tr.StartTime)
                .IsRequired()
                .HasColumnName("StartTime");

            timeRange.Property(tr => tr.EndTime)
                .IsRequired()
                .HasColumnName("EndTime");
        });

        builder.OwnsOne(ts => ts.Price, price =>
        {
            price.Property(p => p.Amount)
                .IsRequired()
                .HasPrecision(18, 2)
                .HasColumnName("Price");

            price.Property(p => p.Currency)
                .IsRequired()
                .HasMaxLength(3)
                .HasColumnName("Currency");
        });

        builder.HasOne(ts => ts.Pitch)
            .WithMany(p => p.TimeSlots)
            .HasForeignKey(ts => ts.PitchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(ts => ts.Bookings)
            .WithOne(b => b.TimeSlot)
            .HasForeignKey(b => b.TimeSlotId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(ts => ts.PitchId);
        builder.HasIndex(ts => ts.IsActive);

        builder.HasQueryFilter(ts => !ts.IsDeleted);
    }
}
