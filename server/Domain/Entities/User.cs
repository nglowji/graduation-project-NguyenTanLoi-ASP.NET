using Domain.Common;
using Domain.Enums;
using Domain.Exceptions;

namespace Domain.Entities;

public class User : BaseEntity, IAggregateRoot
{
    private User() { } // EF Core constructor

    private User(string email, string fullName, string phoneNumber, string passwordHash, UserRole role)
    {
        Email = email;
        FullName = fullName;
        PhoneNumber = phoneNumber;
        PasswordHash = passwordHash;
        Role = role;
        IsActive = true;
    }

    public string Email { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string PhoneNumber { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public UserRole Role { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime? LastLoginAt { get; private set; }

    public static User Create(string email, string fullName, string phoneNumber, string passwordHash, UserRole role)
    {
        ValidateCreationParameters(email, fullName, phoneNumber, passwordHash);
        return new User(email, fullName, phoneNumber, passwordHash, role);
    }

    public void UpdateProfile(string fullName, string phoneNumber)
    {
        ValidateFullName(fullName);
        ValidatePhoneNumber(phoneNumber);
        
        FullName = fullName;
        PhoneNumber = phoneNumber;
        MarkAsUpdated();
    }

    public void ChangePassword(string newPasswordHash)
    {
        ValidatePasswordHash(newPasswordHash);
        PasswordHash = newPasswordHash;
        MarkAsUpdated();
    }

    public void Deactivate()
    {
        EnsureIsActive();
        IsActive = false;
        MarkAsUpdated();
    }

    public void Activate()
    {
        EnsureIsInactive();
        IsActive = true;
        MarkAsUpdated();
    }

    public void RecordLogin()
    {
        LastLoginAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    public bool IsPitchOwner() => Role == UserRole.PitchOwner;
    public bool IsAdmin() => Role == UserRole.Admin;
    public bool IsCustomer() => Role == UserRole.Customer;
    public bool HasRole(UserRole role) => Role == role;

    private static void ValidateCreationParameters(string email, string fullName, string phoneNumber, string passwordHash)
    {
        ValidateEmail(email);
        ValidateFullName(fullName);
        ValidatePhoneNumber(phoneNumber);
        ValidatePasswordHash(passwordHash);
    }

    private static void ValidateEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new DomainException("Email is required");
    }

    private static void ValidateFullName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            throw new DomainException("Full name is required");
    }

    private static void ValidatePhoneNumber(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            throw new DomainException("Phone number is required");
    }

    private static void ValidatePasswordHash(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainException("Password hash is required");
    }

    private void EnsureIsActive()
    {
        if (!IsActive)
            throw new DomainException("User is already inactive");
    }

    private void EnsureIsInactive()
    {
        if (IsActive)
            throw new DomainException("User is already active");
    }
}
