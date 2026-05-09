using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.ValueObjects;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Data;

public static class ApplicationDbContextSeed
{
    public static async Task SeedAsync(ApplicationDbContext context, IPasswordHasher passwordHasher, ILogger logger)
    {
        try
        {
            if (context.Database.IsSqlServer())
            {
                await context.Database.MigrateAsync();
            }

            if (!await context.Users.AnyAsync())
            {
                var passwordHash = passwordHasher.HashPassword("123456");

                var admin = User.Create(
                    "admin@smartsport.com",
                    "System Admin",
                    "0901234567",
                    passwordHash, 
                    UserRole.Admin
                );
                
                var owner = User.Create(
                    "owner@smartsport.com",
                    "Chủ Sân Mặc Định",
                    "0987654321",
                    passwordHash,
                    UserRole.PitchOwner
                );

                await context.Users.AddRangeAsync(admin, owner);
                await context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database.");
        }
    }
}
