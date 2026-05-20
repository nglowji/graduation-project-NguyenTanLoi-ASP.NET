using Domain.Common;
using Domain.Enums;
using Domain.Exceptions;

namespace Domain.Entities;

public class User : BaseEntity, IAggregateRoot
{
    private const int MaxEmailLength = 255;
    private const int MaxFullNameLength = 200;
    private const int MaxPhoneNumberLength = 20;
    private const int MaxPasswordHashLength = 500;

    private User() { } // EF Core constructor

    private User(string email, string fullName, string phoneNumber, string? address, string passwordHash, UserRole role)
    {
        Email = email;
        FullName = fullName;
        PhoneNumber = phoneNumber;
        Address = address;
        PasswordHash = passwordHash;
        Role = role;
        IsActive = true;
    }

    public string Email { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string PhoneNumber { get; private set; } = string.Empty;
    public string? Address { get; private set; }
    public string? MapLink { get; private set; }
    public string PasswordHash { get; private set; } = string.Empty;
    public UserRole Role { get; private set; }
    public Guid? OwnerId { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime? LastLoginAt { get; private set; }

    public static User Create(string email, string fullName, string phoneNumber, string? address, string passwordHash, UserRole role)
    {
        ValidateCreationParameters(email, fullName, phoneNumber, passwordHash);
        return new User(email, fullName, phoneNumber, address, passwordHash, role);
    }

    public void UpdateProfile(string fullName, string phoneNumber, string? address, string? mapLink = null)
    {
        ValidateFullName(fullName);
        ValidatePhoneNumber(phoneNumber);

        FullName = fullName;
        PhoneNumber = phoneNumber;
        Address = address;
        MapLink = mapLink;
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
    public bool IsPitchStaff() => Role == UserRole.PitchStaff;

    public void AssignOwner(Guid ownerId)
    {
        if (ownerId == Guid.Empty)
            throw new DomainException("Owner ID is required");

        OwnerId = ownerId;
        MarkAsUpdated();
    }

    public void ClearOwner()
    {
        OwnerId = null;
        MarkAsUpdated();
    }

    public void PromoteToPitchOwner()
    {
        if (Role == UserRole.PitchOwner)
            return;

        if (Role != UserRole.Customer)
            throw new DomainException("Only customer accounts can register as pitch owners");

        Role = UserRole.PitchOwner;
        MarkAsUpdated();
    }

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

        if (email.Length > MaxEmailLength)
            throw new DomainException($"Email cannot exceed {MaxEmailLength} characters");
    }

    private static void ValidateFullName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            throw new DomainException("Full name is required");

        if (fullName.Length > MaxFullNameLength)
            throw new DomainException($"Full name cannot exceed {MaxFullNameLength} characters");
    }

    private static void ValidatePhoneNumber(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return; // Allow empty phone number (e.g. for Social Login)

        if (phoneNumber.Length > MaxPhoneNumberLength)
            throw new DomainException($"Phone number cannot exceed {MaxPhoneNumberLength} characters");
    }

    private static void ValidatePasswordHash(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainException("Password hash is required");

        if (passwordHash.Length > MaxPasswordHashLength)
            throw new DomainException($"Password hash cannot exceed {MaxPasswordHashLength} characters");
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
