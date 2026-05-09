using Application.Common.DTOs;
using Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using System.Net.Http.Json;

namespace Infrastructure.Services;

public class FacebookAuthService : IFacebookAuthService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<FacebookAuthService> _logger;

    public FacebookAuthService(HttpClient httpClient, ILogger<FacebookAuthService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<Result<FacebookUserInfo>> VerifyTokenAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        try
        {
            // Call Facebook Graph API to get user info
            var url = $"https://graph.facebook.com/me?fields=id,name,email,picture&access_token={accessToken}";
            var response = await _httpClient.GetAsync(url, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Facebook token verification failed. StatusCode: {StatusCode}, Error: {Error}", response.StatusCode, error);
                return Result<FacebookUserInfo>.Failure("Failed to verify Facebook access token.");
            }

            var fbUser = await response.Content.ReadFromJsonAsync<FacebookGraphResponse>(cancellationToken: cancellationToken);

            if (fbUser == null || string.IsNullOrEmpty(fbUser.Id))
            {
                return Result<FacebookUserInfo>.Failure("Invalid Facebook user information received.");
            }

            // Note: Facebook email might be null if user didn't grant permission or doesn't have one
            var email = fbUser.Email ?? $"{fbUser.Id}@facebook.com";

            var userInfo = new FacebookUserInfo(
                Email: email,
                Name: fbUser.Name,
                Picture: fbUser.Picture?.Data?.Url ?? "",
                FacebookId: fbUser.Id
            );

            return Result<FacebookUserInfo>.Success(userInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred during Facebook token verification.");
            return Result<FacebookUserInfo>.Failure("An error occurred during verification.");
        }
    }
}

internal class FacebookGraphResponse
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Email { get; set; }
    public FacebookPicture? Picture { get; set; }
}

internal class FacebookPicture
{
    public FacebookPictureData? Data { get; set; }
}

internal class FacebookPictureData
{
    public string? Url { get; set; }
}
