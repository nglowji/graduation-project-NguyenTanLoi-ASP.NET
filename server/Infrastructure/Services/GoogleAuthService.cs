using Application.Common.DTOs;
using Application.Common.Interfaces;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Json;

namespace Infrastructure.Services;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly string _clientId;
    private readonly ILogger<GoogleAuthService> _logger;

    private readonly HttpClient _httpClient;

    public GoogleAuthService(IConfiguration configuration, ILogger<GoogleAuthService> logger, HttpClient httpClient)
    {
        _clientId = configuration["GoogleAuth:ClientId"] ?? throw new InvalidOperationException("Google ClientId is not configured.");
        _logger = logger;
        _httpClient = httpClient;
    }

    public async Task<Result<GoogleUserInfo>> VerifyTokenAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        try
        {
            // Call Google UserInfo endpoint using access_token
            var response = await _httpClient.GetAsync($"https://www.googleapis.com/oauth2/v3/userinfo?access_token={accessToken}", cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Google token verification failed. StatusCode: {StatusCode}, Error: {Error}", response.StatusCode, errorContent);
                return Result<GoogleUserInfo>.Failure("Failed to verify Google access token.");
            }

            var userInfoResponse = await response.Content.ReadFromJsonAsync<GoogleUserInfoResponse>(cancellationToken: cancellationToken);

            if (userInfoResponse == null || string.IsNullOrEmpty(userInfoResponse.Email))
            {
                _logger.LogWarning("Google user info response was null or missing email.");
                return Result<GoogleUserInfo>.Failure("Invalid Google user information received.");
            }

            var userInfo = new GoogleUserInfo(
                Email: userInfoResponse.Email,
                Name: userInfoResponse.Name,
                Picture: userInfoResponse.Picture,
                GoogleId: userInfoResponse.Sub
            );

            return Result<GoogleUserInfo>.Success(userInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred during Google token verification.");
            return Result<GoogleUserInfo>.Failure("An error occurred during verification.");
        }
    }
}

public record GoogleUserInfoResponse(
    string Sub,
    string Name,
    string Email,
    string Picture
);
