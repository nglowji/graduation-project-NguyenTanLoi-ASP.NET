using Application.Common.DTOs;
using Application.Common.Interfaces;
using Application.Features.Auth.Commands.Login;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Auth.Commands.GoogleLogin;

public class GoogleLoginCommandHandler : IRequestHandler<GoogleLoginCommand, Result<AuthResponse>>
{
    private readonly IGoogleAuthService _googleAuthService;
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<GoogleLoginCommandHandler> _logger;

    public GoogleLoginCommandHandler(
        IGoogleAuthService googleAuthService,
        IUserRepository userRepository,
        IJwtTokenService jwtTokenService,
        IApplicationDbContext context,
        ILogger<GoogleLoginCommandHandler> logger)
    {
        _googleAuthService = googleAuthService;
        _userRepository = userRepository;
        _jwtTokenService = jwtTokenService;
        _context = context;
        _logger = logger;
    }

    public async Task<Result<AuthResponse>> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // 1. Verify token with Google
            var verificationResult = await _googleAuthService.VerifyTokenAsync(request.AccessToken, cancellationToken);
            if (!verificationResult.IsSuccess)
            {
                return Result<AuthResponse>.Failure(verificationResult.ErrorMessage!);
            }

            var googleUser = verificationResult.Value!;

            // 2. Check if user exists
            var user = await _userRepository.GetByEmailAsync(googleUser.Email, cancellationToken);

            if (user == null)
            {
                // 3. Create new user if not exists
                user = User.Create(
                    email: googleUser.Email,
                    fullName: googleUser.Name,
                    phoneNumber: "", // Google doesn't always provide phone
                    passwordHash: "EXTERNAL_AUTH_" + Guid.NewGuid().ToString("N"), // Placeholder for password-less account
                    role: UserRole.Customer
                );

                // Note: In a real scenario, you might want to mark the user as 'EmailVerified'
                // and maybe store the GoogleId or Picture URL if the entity supports it.

                await _userRepository.AddAsync(user, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Created new user via Google Login: {Email}", googleUser.Email);
            }
            else
            {
                // Optional: Update user info from Google (name, picture) if desired
                _logger.LogInformation("Existing user logged in via Google: {Email}", googleUser.Email);
            }

            // 4. Generate JWT
            var token = _jwtTokenService.GenerateToken(user);
            var expiresAt = DateTime.UtcNow.AddMinutes(60);

            return Result<AuthResponse>.Success(new AuthResponse(
                UserId: user.Id,
                Email: user.Email,
                FullName: user.FullName,
                Role: user.Role,
                Token: token,
                ExpiresAt: expiresAt
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during Google Login handler.");
            return Result<AuthResponse>.Failure("An unexpected error occurred during Google Login.");
        }
    }
}
