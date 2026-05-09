using Application.Common.DTOs;

namespace Application.Common.Interfaces;

/// <summary>
/// Interface for Google Authentication verification
/// </summary>
public interface IGoogleAuthService
{
    /// <summary>
    /// Verifies the Google ID Token and returns user information
    /// </summary>
    /// <param name="idToken">The ID Token received from frontend</param>
    /// <returns>Result with user details (email, name, picture)</returns>
    Task<Result<GoogleUserInfo>> VerifyTokenAsync(string idToken, CancellationToken cancellationToken = default);
}

public record GoogleUserInfo(
    string Email,
    string Name,
    string Picture,
    string GoogleId
);
