using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.UserId)
            .IsRequired();

        builder.Property(r => r.PitchId)
            .IsRequired();

        builder.Property(r => r.BookingId)
            .IsRequired();

        builder.Property(r => r.Rating)
            .IsRequired();

        builder.Property(r => r.Comment)
            .HasMaxLength(1000);

        // Unique constraint: One booking can have only one review
        builder.HasIndex(r => r.BookingId)
            .IsUnique();

        // Relationship: One pitch has many reviews
        builder.HasOne(r => r.Pitch)
            .WithMany()
            .HasForeignKey(r => r.PitchId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship: One user can have many reviews
        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
