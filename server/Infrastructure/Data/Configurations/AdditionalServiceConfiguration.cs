using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class AdditionalServiceConfiguration : IEntityTypeConfiguration<AdditionalService>
{
    public void Configure(EntityTypeBuilder<AdditionalService> builder)
    {
        builder.ToTable("AdditionalServices");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Icon)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(s => s.IsActive)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(s => s.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasDefaultValue(Domain.Enums.AdditionalServiceStatus.PendingApproval);

        builder.OwnsOne(s => s.Price, price =>
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

        builder.HasOne(s => s.SportCenter)
            .WithMany()
            .HasForeignKey(s => s.SportCenterId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => s.SportCenterId);
        builder.HasIndex(s => s.IsActive);
        builder.HasIndex(s => s.Status);

        builder.HasQueryFilter(s => !s.IsDeleted);
    }
}
