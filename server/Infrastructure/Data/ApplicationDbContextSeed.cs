using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.ValueObjects;
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
            await context.Database.MigrateAsync();

            // Seed Admin User
            var adminId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var adminEmail = "admin@smartsport.vn";
            if (!await context.Users.AnyAsync(u => u.Id == adminId || u.Email == adminEmail))
            {
                var admin = User.Create(
                    "admin@smartsport.vn",
                    "System Administrator",
                    "0123456789",
                    null,
                    passwordHasher.HashPassword("Admin@123"),
                    UserRole.Admin
                );
                // Force ID for stability
                typeof(User).GetProperty("Id")?.SetValue(admin, adminId);

                context.Users.Add(admin);
                await context.SaveChangesAsync();
                logger.LogInformation("Seeded default admin user.");
            }

            // Seed Sample Pitch Owner, Sport Center, and Pitches
            var ownerId = Guid.Parse("00000000-0000-0000-0000-000000000002");
            var ownerEmail = "owner@smartsport.vn";
            if (!await context.Users.AnyAsync(u => u.Id == ownerId || u.Email == ownerEmail))
            {
                var owner = User.Create(
                    "owner@smartsport.vn",
                    "Lợi Nguyễn",
                    "0987654321",
                    "Vĩnh Long",
                    passwordHasher.HashPassword("Owner@123"),
                    UserRole.PitchOwner
                );
                typeof(User).GetProperty("Id")?.SetValue(owner, ownerId);

                context.Users.Add(owner);

                // Thêm Trung Tâm Thể Thao tại Vĩnh Long
                var sportCenterId = Guid.Parse("00000000-0000-0000-0000-000000000003");
                var sportCenter = new SportCenter(
                    "Trung tâm thể thao Vĩnh Long",
                    owner.Id,
                    Address.Create("73 Nguyễn Huệ", "Phường 2", "TP Vĩnh Long", "Vĩnh Long", 10.2530, 105.9722),
                    "Trung tâm thể thao lớn nhất Vĩnh Long với hệ thống sân cỏ nhân tạo đạt chuẩn Quốc gia.",
                    "0901234567"
                );
                typeof(SportCenter).GetProperty("Id")?.SetValue(sportCenter, sportCenterId);
                context.Set<SportCenter>().Add(sportCenter);

                // Sân 5 người
                var pitch1 = Pitch.Create(owner.Id, sportCenter.Id, "Sân bóng đá 5 người (Sân A)", PitchType.Football5, false, "Sân cỏ nhân tạo Vĩnh Long mới thay năm 2024, mặt cỏ êm, chất lượng cao.");
                pitch1.AddImage("https://res.cloudinary.com/dvf2u7c7v/image/upload/v1714152771/smartsport/pitch-5_qgxy6j.jpg", true);
                pitch1.AddTimeSlot(TimeRange.Create(TimeSpan.FromHours(17), TimeSpan.FromHours(18.5)), Money.Create(300000));
                pitch1.AddTimeSlot(TimeRange.Create(TimeSpan.FromHours(18.5), TimeSpan.FromHours(20)), Money.Create(350000));
                pitch1.Approve();
                context.Set<Pitch>().Add(pitch1);

                // Sân 7 người
                var pitch2 = Pitch.Create(owner.Id, sportCenter.Id, "Sân bóng đá 7 người (Sân B)", PitchType.Football7, false, "Sân 7 người rộng rãi, hệ thống chiếu sáng đèn LED cực mạnh tại trung tâm Vĩnh Long.");
                pitch2.AddImage("https://res.cloudinary.com/dvf2u7c7v/image/upload/v1714152771/smartsport/pitch-7_w9fpxf.jpg", true);
                pitch2.AddTimeSlot(TimeRange.Create(TimeSpan.FromHours(17), TimeSpan.FromHours(19)), Money.Create(600000));
                pitch2.AddTimeSlot(TimeRange.Create(TimeSpan.FromHours(19), TimeSpan.FromHours(21)), Money.Create(600000));
                pitch2.Approve();
                context.Set<Pitch>().Add(pitch2);

                await context.SaveChangesAsync();
                logger.LogInformation("Seeded sample pitch owner, sport center in Vinh Long, and pitches successfully.");
            }

            // Seed Sample Customer
            var customerId = Guid.Parse("00000000-0000-0000-0000-000000000004");
            var customerEmail = "customer@smartsport.vn";
            if (!await context.Users.AnyAsync(u => u.Id == customerId || u.Email == customerEmail))
            {
                var customer = User.Create(
                    "customer@smartsport.vn",
                    "Khách Hàng",
                    "0912345678",
                    null,
                    passwordHasher.HashPassword("Customer@123"),
                    UserRole.Customer
                );
                typeof(User).GetProperty("Id")?.SetValue(customer, customerId);

                context.Users.Add(customer);
                await context.SaveChangesAsync();
                logger.LogInformation("Seeded default customer user.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }
}
