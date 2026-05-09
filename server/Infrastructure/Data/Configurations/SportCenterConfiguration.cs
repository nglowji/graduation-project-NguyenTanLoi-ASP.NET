using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class SportCenterConfiguration : IEntityTypeConfiguration<SportCenter>
{
    public void Configure(EntityTypeBuilder<SportCenter> builder)
    {
        builder.ToTable("SportCenters");

        builder.HasKey(sc => sc.Id);

        builder.Property(sc => sc.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.OwnsOne(sc => sc.Address, address =>
        {
            address.Property(a => a.Street)
                .IsRequired()
                .HasMaxLength(500)
                .HasColumnName("Street");

            address.Property(a => a.Ward)
                .HasMaxLength(100)
                .HasColumnName("Ward");

            address.Property(a => a.District)
                .HasMaxLength(100)
                .HasColumnName("District");

            address.Property(a => a.City)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("City");

            address.Property(a => a.Latitude)
                .IsRequired()
                .HasPrecision(10, 7)
                .HasColumnName("Latitude");

            address.Property(a => a.Longitude)
                .IsRequired()
                .HasPrecision(10, 7)
                .HasColumnName("Longitude");
        });

        builder.Property(sc => sc.Description)
            .HasMaxLength(2000);

        builder.Property(sc => sc.PhoneNumber)
            .HasMaxLength(20);

        builder.Property(sc => sc.IsActive)
            .HasDefaultValue(true);

        builder.HasMany(sc => sc.Pitches)
            .WithOne(p => p.SportCenter)
            .HasForeignKey(p => p.SportCenterId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
