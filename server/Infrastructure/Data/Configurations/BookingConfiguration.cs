using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.ToTable("Bookings");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.UserId)
            .IsRequired();

        builder.Property(b => b.TimeSlotId)
            .IsRequired();

        builder.Property(b => b.BookingDate)
            .IsRequired();

        builder.Property(b => b.Status)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(b => b.CancellationReason)
            .HasMaxLength(500);

        builder.Property(b => b.CreatedAt)
            .IsRequired();

        builder.Property(b => b.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.OwnsOne(b => b.TotalPrice, price =>
        {
            price.Property(p => p.Amount)
                .IsRequired()
                .HasPrecision(18, 2)
                .HasColumnName("TotalPrice");

            price.Property(p => p.Currency)
                .IsRequired()
                .HasMaxLength(3)
                .HasColumnName("Currency");
        });

        builder.OwnsOne(b => b.DepositAmount, deposit =>
        {
            deposit.Property(d => d.Amount)
                .IsRequired()
                .HasPrecision(18, 2)
                .HasColumnName("DepositAmount");

            deposit.Property(d => d.Currency)
                .IsRequired()
                .HasMaxLength(3)
                .HasColumnName("DepositCurrency");
        });

        builder.HasOne(b => b.TimeSlot)
            .WithMany(ts => ts.Bookings)
            .HasForeignKey(b => b.TimeSlotId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.Transaction)
            .WithOne(t => t.Booking)
            .HasForeignKey<PaymentTransaction>(t => t.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(b => b.UserId);
        builder.HasIndex(b => b.TimeSlotId);
        builder.HasIndex(b => b.BookingDate);
        builder.HasIndex(b => b.Status);
        builder.HasIndex(b => new { b.TimeSlotId, b.BookingDate });

        builder.HasQueryFilter(b => !b.IsDeleted);
    }
}
