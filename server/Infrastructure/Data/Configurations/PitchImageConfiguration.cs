using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PitchImageConfiguration : IEntityTypeConfiguration<PitchImage>
{
    public void Configure(EntityTypeBuilder<PitchImage> builder)
    {
        builder.ToTable("PitchImages");

        builder.HasKey(pi => pi.Id);

        builder.Property(pi => pi.PitchId)
            .IsRequired();

        builder.Property(pi => pi.ImageUrl)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(pi => pi.IsPrimary)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(pi => pi.DisplayOrder)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(pi => pi.CreatedAt)
            .IsRequired();

        builder.Property(pi => pi.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasOne(pi => pi.Pitch)
            .WithMany(p => p.Images)
            .HasForeignKey(pi => pi.PitchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(pi => pi.PitchId);
        builder.HasIndex(pi => new { pi.PitchId, pi.IsPrimary });

        builder.HasQueryFilter(pi => !pi.IsDeleted);
    }
}
