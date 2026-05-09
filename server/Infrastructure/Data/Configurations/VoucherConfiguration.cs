using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class VoucherConfiguration : IEntityTypeConfiguration<Voucher>
{
    public void Configure(EntityTypeBuilder<Voucher> builder)
    {
        builder.ToTable("Vouchers");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(v => v.Description)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(v => v.DiscountAmount)
            .HasPrecision(18, 2);

        builder.Property(v => v.MinimumOrderAmount)
            .HasPrecision(18, 2);

        builder.HasIndex(v => v.Code)
            .IsUnique();
    }
}
