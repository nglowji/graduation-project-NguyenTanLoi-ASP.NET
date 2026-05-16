using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class BookingServiceConfiguration : IEntityTypeConfiguration<BookingService>
{
    public void Configure(EntityTypeBuilder<BookingService> builder)
    {
        builder.ToTable("BookingServices");

        builder.HasKey(bs => bs.Id);

        builder.OwnsOne(bs => bs.Price, price =>
        {
            price.Property(p => p.Amount).HasColumnName("PriceAmount").HasPrecision(18, 2);
            price.Property(p => p.Currency).HasColumnName("PriceCurrency");
        });

        builder.HasOne(bs => bs.Booking)
            .WithMany(b => b.Services)
            .HasForeignKey(bs => bs.BookingId);

        builder.HasOne(bs => bs.Service)
            .WithMany()
            .HasForeignKey(bs => bs.ServiceId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasQueryFilter(bs =>
            !bs.IsDeleted &&
            !bs.Booking.IsDeleted &&
            !bs.Service.IsDeleted);
    }
}
