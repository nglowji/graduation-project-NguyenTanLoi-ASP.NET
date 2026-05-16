using Application.Common.Interfaces;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using StackExchange.Redis;

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)
            )
        );

        var redisConnectionString = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConnectionString))
        {
            var redisOptions = ConfigurationOptions.Parse(redisConnectionString);
            redisOptions.AbortOnConnectFail = false;
            redisOptions.ConnectRetry = 1;
            redisOptions.ConnectTimeout = 1000;

            try
            {
                var redis = ConnectionMultiplexer.Connect(redisOptions);
                if (redis.IsConnected)
                {
                    services.AddSingleton<IConnectionMultiplexer>(redis);
                    services.AddStackExchangeRedisCache(options =>
                    {
                        options.ConfigurationOptions = redisOptions;
                        options.InstanceName = "SmartSport_";
                    });
                }
                else
                {
                    redis.Dispose();
                    services.AddDistributedMemoryCache();
                }
            }
            catch
            {
                services.AddDistributedMemoryCache();
            }
        }
        else
        {
            services.AddDistributedMemoryCache();
        }

        services.AddScoped<ICacheService, CacheService>();
        services.AddScoped<IEmailService, SmtpEmailService>();
        services.AddSingleton<IQRService, QRCodeService>();

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<ApplicationDbContext>()
        );

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IPitchRepository, PitchRepository>();
        services.AddScoped<IBookingRepository, BookingRepository>();
        services.AddScoped<ITimeSlotRepository, TimeSlotRepository>();
        services.AddScoped<IBookingLockRepository, BookingLockRepository>();
        services.AddScoped<IUserPreferenceRepository, UserPreferenceRepository>();
        services.AddScoped<IChatConversationRepository, ChatConversationRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();
        services.AddScoped<IWaitlistRepository, WaitlistRepository>();
        services.AddScoped<ISystemConfigurationRepository, SystemConfigurationRepository>();

        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IPaymentService, VnpayPaymentService>();
        services.AddScoped<IPaymentGateway, VnpayPaymentService>();
        services.AddHttpClient<IPaymentGateway, ZaloPayPaymentService>();
        services.AddScoped<IPaymentGatewayResolver, PaymentGatewayResolver>();
        
        services.AddHttpClient<IGoogleAuthService, GoogleAuthService>();
        services.AddHttpClient<IFacebookAuthService, FacebookAuthService>();
        
        // AI & Maps Services
        services.AddHttpClient<IGeminiAIService, GeminiAIService>();
        services.AddHttpClient<IMapService, GoogleMapsService>();

        // MongoDB Registration
        services.AddSingleton<IMongoDbContext, MongoDbContext>();
        services.AddScoped<ISystemLogRepository, SystemLogRepository>();

        return services;
    }
}
