using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class SystemConfigurationConfiguration : IEntityTypeConfiguration<SystemConfiguration>
{
    public void Configure(EntityTypeBuilder<SystemConfiguration> builder)
    {
        builder.ToTable("SystemConfigurations");

        builder.HasKey(item => item.Id);

        builder.Property(item => item.Key)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(item => item.Value)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(item => item.Description)
            .HasMaxLength(500);

        builder.HasIndex(item => item.Key)
            .IsUnique()
            .HasDatabaseName("IX_SystemConfigurations_Key");

        builder.HasQueryFilter(item => !item.IsDeleted);
    }
}
