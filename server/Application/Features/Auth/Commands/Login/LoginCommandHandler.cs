using Application.Common.Interfaces;
using Application.Common.Models;
using Application.Features.Auth.Commands.Register;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<LoginCommandHandler> _logger;

    public LoginCommandHandler(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        IApplicationDbContext context,
        ILogger<LoginCommandHandler> logger)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _context = context;
        _logger = logger;
    }

    public async Task<Result<AuthResponse>> Handle(
        LoginCommand request,
        CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (user == null)
            return Result<AuthResponse>.Failure("Invalid email or password");

        if (!user.IsActive)
            return Result<AuthResponse>.Failure("Account is inactive. Please contact support.");

        var isPasswordValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            _logger.LogWarning(
                "Failed login attempt for email {Email}",
                request.Email
            );
            return Result<AuthResponse>.Failure("Invalid email or password");
        }

        user.RecordLogin();
        await _context.SaveChangesAsync(cancellationToken);

        var token = _jwtTokenService.GenerateToken(user);
        var expiresAt = DateTime.UtcNow.AddMinutes(60);

        _logger.LogInformation(
            "User {UserId} logged in successfully",
            user.Id
        );

        var response = new AuthResponse(
            user.Id,
            user.Email,
            user.FullName,
            user.Role,
            token,
            expiresAt
        );

        return Result<AuthResponse>.Success(response);
    }
}
