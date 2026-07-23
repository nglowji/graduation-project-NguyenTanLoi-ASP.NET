namespace Application.Common.Interfaces;

public interface IGeminiService
{
    Task<string> GenerateChatResponseAsync(string prompt);
}
