using System.Reflection;
using System.Text;
using Api.BackgroundServices;
using Api.Middlewares;
using Application;
using Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog Configuration
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSignalR();

// Prevent BackgroundService crashes from stopping the entire host
builder.Services.Configure<HostOptions>(options =>
{
    options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore;
});

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("OwnerOnly", policy => policy.RequireRole("PitchOwner"));
    options.AddPolicy("CustomerOnly", policy => policy.RequireRole("Customer"));
    options.AddPolicy("OwnerOrAdmin", policy => policy.RequireRole("PitchOwner", "Admin"));
});

// Swagger Configuration
builder.Services.AddSwaggerGen(options =>
{
    options.CustomSchemaIds(type => (type.FullName ?? type.Name).Replace('+', '.'));

    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Sports Pitch Booking API",
        Version = "v1",
        Description = "API for sports pitch booking system",
        Contact = new OpenApiContact
        {
            Name = "Support Team",
            Email = "support@sportsbooking.com"
        }
    });

    // JWT Authentication in Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        var allowedOrigins = builder.Configuration["Cors:AllowedOrigins"]?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            ?? builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:3000", "http://localhost:5173" };

        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Application & Infrastructure Layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<Application.Common.Interfaces.IBookingNotificationService, Api.Services.BookingNotificationService>();
builder.Services.AddSingleton<Api.Services.IPasswordResetService, Api.Services.PasswordResetService>();

// Background Services
builder.Services.AddHostedService<BookingLockCleanupService>();
builder.Services.AddHostedService<PaymentTimeoutService>();

// Health Checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Configure the HTTP request pipeline
var swaggerEnabled = app.Environment.IsDevelopment()
    || builder.Configuration.GetValue<bool>("Swagger:Enabled");

if (swaggerEnabled)
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Sports Pitch Booking API v1");
        options.RoutePrefix = "swagger";
    });
}

app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

app.UseSerilogRequestLogging();

// app.UseHttpsRedirection(); // Commented out for easier local development with HTTP

app.UseCors("AllowAll");

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Ok(new
{
    Status = "Healthy",
    Service = "Sports Pitch Booking API",
    Environment = app.Environment.EnvironmentName,
    Health = "/health",
    ApiHealth = "/api/health",
    Swagger = swaggerEnabled ? "/swagger" : "Disabled. Set Swagger__Enabled=true to enable it."
}));

app.MapControllers();
app.MapHub<Api.Hubs.BookingHub>("/hubs/booking");

app.MapHealthChecks("/health");

try
{
    Log.Information("=========================================================");
    Log.Information("🚀 ĐANG KHỞI ĐỘNG BACKEND SPORTS PITCH BOOKING...");
    Log.Information("=========================================================");
    
    // Apply database migrations without creating default data.
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var context = services.GetRequiredService<Infrastructure.Data.ApplicationDbContext>();
        var logger = services.GetRequiredService<ILogger<Program>>();
        
        Log.Information("Applying database migrations...");
        await Infrastructure.Data.ApplicationDbContextSeed.SeedAsync(context, logger);
        Log.Information("Database is ready. No default data was created.");
    }

    Log.Information("🌟 SERVER ĐANG CHẠY MƯỢT MÀ! (Bấm Ctrl+C để tắt)");
    Log.Information("=========================================================");
    app.Run();
}
catch (IOException ex) when (ex.Message.Contains("address already in use", StringComparison.OrdinalIgnoreCase))
{
    Log.Fatal("Backend không thể khởi động vì cổng đang được một tiến trình khác sử dụng. Hãy dừng backend cũ trước khi chạy lại.");
}
catch (Exception ex)
{
    Log.Fatal(ex, "Backend khởi động thất bại.");
}
finally
{
    Log.CloseAndFlush();
}
