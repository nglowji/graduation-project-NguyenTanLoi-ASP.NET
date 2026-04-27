using System;

namespace Tools;

/// <summary>
/// Tool để generate BCrypt password hash cho seed data
/// </summary>
public class GeneratePasswordHash
{
    private const int WorkFactor = 12;

    public static void Main(string[] args)
    {
        Console.WriteLine("=== BCrypt Password Hash Generator ===\n");

        var passwords = new[]
        {
            ("Admin@123", "Admin"),
            ("Owner@123", "Owner"),
            ("Customer@123", "Customer")
        };

        foreach (var (password, role) in passwords)
        {
            var hash = BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
            Console.WriteLine($"{role} Password: {password}");
            Console.WriteLine($"Hash: {hash}");
            Console.WriteLine();
        }

        Console.WriteLine("\n=== Verification Test ===");
        foreach (var (password, role) in passwords)
        {
            var hash = BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
            var isValid = BCrypt.Net.BCrypt.Verify(password, hash);
            Console.WriteLine($"{role}: {(isValid ? "✓ VALID" : "✗ INVALID")}");
        }
    }
}
