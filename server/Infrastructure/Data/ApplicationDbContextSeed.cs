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
                    "Chủ Sân Thống Nhất",
                    "0987654321",
                    passwordHash,
                    UserRole.PitchOwner
                );

                var customer = User.Create(
                    "user@example.com",
                    "Nguyễn Văn A",
                    "0912345678",
                    passwordHash,
                    UserRole.Customer
                );

                await context.Users.AddRangeAsync(admin, owner, customer);
                await context.SaveChangesAsync();
                
                if (!await context.Pitches.AnyAsync())
                {
                    var pitches = new List<Pitch>
                    {
                        Pitch.Create(
                            owner.Id,
                            "Sân bóng Thống Nhất",
                            PitchType.Football5,
                            Address.Create("123 Đào Duy Từ", "Phường 6", "Quận 10", "TP. Hồ Chí Minh", 10.7634, 106.6625),
                            "Sân cỏ nhân tạo tiêu chuẩn quốc tế, đèn chiếu sáng cực tốt."
                        ),
                        Pitch.Create(
                            owner.Id,
                            "Sân bóng Phú Thọ",
                            PitchType.Football7,
                            Address.Create("2-4 Lê Đại Hành", "Phường 15", "Quận 11", "TP. Hồ Chí Minh", 10.7711, 106.6578),
                            "Không gian rộng rãi, thoáng mát, có bãi đậu xe ô tô."
                        ),
                        Pitch.Create(
                            owner.Id,
                            "Sân bóng Chảo Lửa",
                            PitchType.Football5,
                            Address.Create("30 Phan Thúc Duyện", "Phường 4", "Quận Tân Bình", "TP. Hồ Chí Minh", 10.8012, 106.6615),
                            "Hệ thống sân mini cỏ nhân tạo hiện đại nhất khu vực Tân Bình."
                        )
                    };

                    foreach (var pitch in pitches)
                    {
                        pitch.Approve(); // Mark as Active
                    }

                    await context.Pitches.AddRangeAsync(pitches);
                    await context.SaveChangesAsync();
                    
                    // Seed TimeSlots for the first pitch
                    var pitch1 = pitches[0];
                    var timeSlots = new List<TimeSlot>();
                    for (int i = 6; i <= 21; i++)
                    {
                        var price = i < 16 ? 300000 : 450000;
                        var ts = TimeSlot.Create(
                            pitch1.Id,
                            TimeRange.Create(TimeSpan.FromHours(i), TimeSpan.FromHours(i + 1)),
                            Money.Create(price, "VND")
                        );
                        timeSlots.Add(ts);
                    }
                    await context.TimeSlots.AddRangeAsync(timeSlots);
                    await context.SaveChangesAsync();
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database.");
        }
    }
}
