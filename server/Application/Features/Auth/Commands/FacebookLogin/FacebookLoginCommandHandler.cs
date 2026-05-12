using Application.Common.DTOs;
using Application.Common.Interfaces;
using Application.Features.Auth.Commands.Login;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Auth.Commands.FacebookLogin;

public class FacebookLoginCommandHandler : IRequestHandler<FacebookLoginCommand, Result<AuthResponse>>
{
    private readonly IFacebookAuthService _facebookAuthService;
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<FacebookLoginCommandHandler> _logger;

    public FacebookLoginCommandHandler(
        IFacebookAuthService facebookAuthService,
        IUserRepository userRepository,
        IJwtTokenService jwtTokenService,
        IApplicationDbContext context,
        ILogger<FacebookLoginCommandHandler> logger)
    {
        _facebookAuthService = facebookAuthService;
        _userRepository = userRepository;
        _jwtTokenService = jwtTokenService;
        _context = context;
        _logger = logger;
    }

    public async Task<Result<AuthResponse>> Handle(FacebookLoginCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // 1. Verify token with Facebook
            var verificationResult = await _facebookAuthService.VerifyTokenAsync(request.AccessToken, cancellationToken);
            if (!verificationResult.IsSuccess)
            {
                return Result<AuthResponse>.Failure(verificationResult.ErrorMessage!);
            }

            var fbUser = verificationResult.Value!;

            // 2. Check if user exists (by email)
            var user = await _userRepository.GetByEmailAsync(fbUser.Email, cancellationToken);

            if (user == null)
            {
                // 3. Create new user if not exists
                user = User.Create(
                    email: fbUser.Email,
                    fullName: fbUser.Name,
                    phoneNumber: "", 
                    address: null,
                    passwordHash: "EXTERNAL_AUTH_FB_" + Guid.NewGuid().ToString("N"),
                    role: UserRole.Customer
                );

                await _userRepository.AddAsync(user, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Created new user via Facebook Login: {Email}", fbUser.Email);
            }
            else
            {
                _logger.LogInformation("Existing user logged in via Facebook: {Email}", fbUser.Email);
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
            _logger.LogError(ex, "Unexpected error during Facebook Login handler.");
            return Result<AuthResponse>.Failure("An unexpected error occurred during Facebook Login.");
        }
    }
}
