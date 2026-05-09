using Application.Common.DTOs;

namespace Application.Common.Interfaces;

/// <summary>
/// Interface for Facebook Authentication verification
/// </summary>
public interface IFacebookAuthService
{
    /// <summary>
    /// Verifies the Facebook Access Token and returns user information
    /// </summary>
    /// <param name="accessToken">The access token received from frontend</param>
    /// <returns>Result with user details (email, name, picture)</returns>
    Task<Result<FacebookUserInfo>> VerifyTokenAsync(string accessToken, CancellationToken cancellationToken = default);
}

public record FacebookUserInfo(
    string Email,
    string Name,
    string Picture,
    string FacebookId
);
