using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PaymentTransactionConfiguration : IEntityTypeConfiguration<PaymentTransaction>
{
    public void Configure(EntityTypeBuilder<PaymentTransaction> builder)
    {
        builder.ToTable("PaymentTransactions");

        builder.HasKey(pt => pt.Id);

        builder.Property(pt => pt.BookingId)
            .IsRequired();

        builder.Property(pt => pt.Gateway)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(pt => pt.ProviderTxnId)
            .HasMaxLength(200);

        builder.Property(pt => pt.Status)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(pt => pt.TransactionDate)
            .IsRequired();

        builder.Property(pt => pt.FailureReason)
            .HasMaxLength(500);

        builder.Property(pt => pt.RefundReason)
            .HasMaxLength(500);

        builder.Property(pt => pt.CreatedAt)
            .IsRequired();

        builder.Property(pt => pt.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.OwnsOne(pt => pt.Amount, amount =>
        {
            amount.Property(a => a.Amount)
                .IsRequired()
                .HasPrecision(18, 2)
                .HasColumnName("Amount");

            amount.Property(a => a.Currency)
                .IsRequired()
                .HasMaxLength(3)
                .HasColumnName("Currency");
        });

        builder.HasOne(pt => pt.Booking)
            .WithOne(b => b.Transaction)
            .HasForeignKey<PaymentTransaction>(pt => pt.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(pt => pt.BookingId)
            .IsUnique();

        builder.HasIndex(pt => pt.ProviderTxnId);
        builder.HasIndex(pt => pt.Status);
        builder.HasIndex(pt => pt.TransactionDate);

        builder.HasQueryFilter(pt => !pt.IsDeleted);
    }
}
