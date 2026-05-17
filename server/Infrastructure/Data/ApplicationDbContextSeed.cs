using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Data;

public static class ApplicationDbContextSeed
{
    public static async Task SeedAsync(
        ApplicationDbContext context,
        ILogger logger)
    {
        try
        {
            await context.Database.MigrateAsync();
            logger.LogInformation("Database schema is up to date. No default data was seeded.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while migrating the database.");
            throw;
        }
    }
}
