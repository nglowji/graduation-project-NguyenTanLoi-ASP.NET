using MongoDB.Driver;

namespace Application.Common.Interfaces;

public interface IMongoDbContext
{
    IMongoDatabase Database { get; }
    IMongoCollection<T> GetCollection<T>(string name);
}
