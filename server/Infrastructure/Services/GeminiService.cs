using System.Net.Http.Json;
using Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class GeminiService : IGeminiService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GeminiService> _logger;
    private readonly string _apiKey;
    private readonly string _model;

    public GeminiService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GeminiService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _apiKey = configuration["GeminiAI:ApiKey"] ?? string.Empty;
        _model = configuration["GeminiAI:Model"] ?? "gemini-2.0-flash";

        _httpClient.BaseAddress = new Uri("https://generativelanguage.googleapis.com/v1beta/");
        _httpClient.Timeout = TimeSpan.FromSeconds(20);
    }

    public async Task<string> GenerateChatResponseAsync(string prompt)
    {
        if (string.IsNullOrWhiteSpace(_apiKey) || _apiKey.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Gemini API key is not configured or is using a placeholder.");
            throw new InvalidOperationException("Gemini API key is not configured.");
        }

        try
        {
            var request = new
            {
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new[] { new { text = prompt } }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.3, // Lower temperature to prevent hallucination
                    topK = 40,
                    topP = 0.95,
                    maxOutputTokens = 1500
                }
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"models/{_model}:generateContent?key={_apiKey}",
                request);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogError(
                    "Gemini API request failed with status code {StatusCode}. Response: {Body}",
                    response.StatusCode,
                    errorBody);
                throw new HttpRequestException($"Gemini API request failed with status code {response.StatusCode}. Details: {errorBody}");
            }

            var result = await response.Content.ReadFromJsonAsync<GeminiResponseDto>();
            var text = result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;

            if (string.IsNullOrWhiteSpace(text))
            {
                _logger.LogWarning("Gemini API returned an empty or null response text.");
                throw new InvalidOperationException("Gemini API returned an empty response.");
            }

            return text.Trim();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during calling Gemini API.");
            throw;
        }
    }
}

internal class GeminiResponseDto
{
    public List<CandidateDto>? Candidates { get; set; }
}

internal class CandidateDto
{
    public ContentDto? Content { get; set; }
}

internal class ContentDto
{
    public List<PartDto>? Parts { get; set; }
}

internal class PartDto
{
    public string? Text { get; set; }
}
