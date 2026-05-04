using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class UserPreferenceConfiguration : IEntityTypeConfiguration<UserPreference>
{
    public void Configure(EntityTypeBuilder<UserPreference> builder)
    {
        builder.ToTable("UserPreferences");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.UserId)
            .IsRequired();

        builder.HasIndex(p => p.UserId)
            .IsUnique();

        // Store lists as JSON
        builder.Property(p => p.PreferredPitchTypes)
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<List<int>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<int>())
            .HasColumnType("nvarchar(max)");

        builder.Property(p => p.PreferredTimeSlots)
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>())
            .HasColumnType("nvarchar(max)");

        builder.Property(p => p.PreferredLocations)
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>())
            .HasColumnType("nvarchar(max)");

        builder.Property(p => p.AverageBudget)
            .HasColumnType("decimal(18,2)");

        builder.Property(p => p.BookingFrequency)
            .HasDefaultValue(0);

        builder.Property(p => p.AverageAdvanceBookingHours)
            .HasDefaultValue(0);

        builder.Property(p => p.HomeLatitude)
            .HasColumnType("float");

        builder.Property(p => p.HomeLongitude)
            .HasColumnType("float");

        builder.Property(p => p.WorkLatitude)
            .HasColumnType("float");

        builder.Property(p => p.WorkLongitude)
            .HasColumnType("float");

        // Indexes for performance
        builder.HasIndex(p => p.CreatedAt);
        builder.HasIndex(p => p.UpdatedAt);
    }
}
