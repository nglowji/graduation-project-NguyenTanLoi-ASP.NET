using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PitchConfiguration : IEntityTypeConfiguration<Pitch>
{
    public void Configure(EntityTypeBuilder<Pitch> builder)
    {
        builder.ToTable("Pitches");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.SportCenterId)
            .IsRequired();

        builder.HasOne(p => p.SportCenter)
            .WithMany(sc => sc.Pitches)
            .HasForeignKey(p => p.SportCenterId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(p => p.OwnerId)
            .IsRequired();

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Type)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(p => p.Description)
            .HasMaxLength(2000);

        builder.Property(p => p.Status)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(p => p.AverageRating)
            .HasPrecision(3, 2)
            .HasDefaultValue(0);

        builder.Property(p => p.TotalReviews)
            .HasDefaultValue(0);

        builder.Property(p => p.CreatedAt)
            .IsRequired();

        builder.Property(p => p.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasMany(p => p.TimeSlots)
            .WithOne(ts => ts.Pitch)
            .HasForeignKey(ts => ts.PitchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Images)
            .WithOne(img => img.Pitch)
            .HasForeignKey(img => img.PitchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => p.OwnerId);
        builder.HasIndex(p => p.Type);
        builder.HasIndex(p => p.Status);

        builder.HasQueryFilter(p => !p.IsDeleted);
    }
}
