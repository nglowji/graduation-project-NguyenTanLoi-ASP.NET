using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class ChatConversationConfiguration : IEntityTypeConfiguration<ChatConversation>
{
    public void Configure(EntityTypeBuilder<ChatConversation> builder)
    {
        builder.ToTable("ChatConversations");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.UserId)
            .IsRequired();

        builder.Property(c => c.SessionId)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(c => c.SessionId)
            .IsUnique();

        builder.HasIndex(c => c.UserId);

        // Store messages as JSON
        builder.Property(c => c.Messages)
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<List<ChatMessage>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<ChatMessage>())
            .HasColumnType("nvarchar(max)")
            .Metadata.SetValueComparer(new Microsoft.EntityFrameworkCore.ChangeTracking.ValueComparer<List<ChatMessage>>(
                (c1, c2) => c1 != null && c2 != null && c1.SequenceEqual(c2),
                c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                c => c.ToList()));

        builder.Property(c => c.LastMessageAt)
            .IsRequired(false);

        builder.Property(c => c.IsActive)
            .HasDefaultValue(true);

        // Indexes for performance
        builder.HasIndex(c => c.LastMessageAt);
        builder.HasIndex(c => c.IsActive);
        builder.HasIndex(c => new { c.UserId, c.IsActive });
    }
}
