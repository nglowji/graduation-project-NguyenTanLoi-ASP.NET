using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Data;

public static class ApplicationDbContextSeed
{
    public static async Task SeedAsync(
        ApplicationDbContext context, 
        IPasswordHasher passwordHasher,
        ILogger logger)
    {
        try
        {
            if (context.Database.IsSqlServer())
            {
                await context.Database.MigrateAsync();
            }

            // Seed Admin User
            if (!await context.Users.AnyAsync(u => u.Role == UserRole.Admin))
            {
                var admin = User.Create(
                    "admin@smartsport.vn",
                    "System Administrator",
                    "0123456789",
                    passwordHasher.HashPassword("Admin@123"),
                    UserRole.Admin
                );

                context.Users.Add(admin);
                await context.SaveChangesAsync();
                logger.LogInformation("Seeded default admin user.");
            }

            // Seed Sample Pitch Owner
            if (!await context.Users.AnyAsync(u => u.Role == UserRole.PitchOwner))
            {
                var owner = User.Create(
                    "owner@smartsport.vn",
                    "Lợi Nguyễn",
                    "0987654321",
                    passwordHasher.HashPassword("Owner@123"),
                    UserRole.PitchOwner
                );

                context.Users.Add(owner);
                await context.SaveChangesAsync();
                logger.LogInformation("Seeded sample pitch owner.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }
}
