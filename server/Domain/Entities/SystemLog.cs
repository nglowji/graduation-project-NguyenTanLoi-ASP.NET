using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Domain.Entities;

public class SystemLog
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Action { get; set; } = null!;
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string? Details { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [BsonExtraElements]
    public Dictionary<string, object> Metadata { get; set; } = new();
}
