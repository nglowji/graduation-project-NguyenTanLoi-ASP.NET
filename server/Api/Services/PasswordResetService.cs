using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace Api.Services;

public interface IPasswordResetService
{
    string CreateOtp(string email);
    string? VerifyOtp(string email, string otp);
    bool ConsumeResetToken(string email, string token);
}

public sealed class PasswordResetService : IPasswordResetService
{
    private readonly ConcurrentDictionary<string, OtpEntry> _otps = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, TokenEntry> _tokens = new(StringComparer.OrdinalIgnoreCase);

    public string CreateOtp(string email)
    {
        var otp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        _otps[email] = new OtpEntry(otp, DateTime.UtcNow.AddMinutes(5));
        return otp;
    }

    public string? VerifyOtp(string email, string otp)
    {
        if (!_otps.TryGetValue(email, out var entry) || entry.ExpiresAt < DateTime.UtcNow || entry.Otp != otp)
            return null;

        _otps.TryRemove(email, out _);
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(24));
        _tokens[email] = new TokenEntry(token, DateTime.UtcNow.AddMinutes(10));
        return token;
    }

    public bool ConsumeResetToken(string email, string token)
    {
        if (!_tokens.TryGetValue(email, out var entry) || entry.ExpiresAt < DateTime.UtcNow || entry.Token != token)
            return false;

        return _tokens.TryRemove(email, out _);
    }

    private sealed record OtpEntry(string Otp, DateTime ExpiresAt);
    private sealed record TokenEntry(string Token, DateTime ExpiresAt);
}
