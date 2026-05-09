using Domain.Common;
using Domain.ValueObjects;

namespace Domain.Entities;

public class SportCenter : BaseEntity, IAggregateRoot
{
    private readonly List<Pitch> _pitches = new();

    private SportCenter() { }

    public SportCenter(string name, Address address, string? description, string? phoneNumber)
    {
        Name = name;
        Address = address;
        Description = description;
        PhoneNumber = phoneNumber;
        IsActive = true;
    }

    public string Name { get; private set; } = null!;
    public Address Address { get; private set; } = null!;
    public string? Description { get; private set; }
    public string? PhoneNumber { get; private set; }
    public bool IsActive { get; private set; }

    public IReadOnlyCollection<Pitch> Pitches => _pitches.AsReadOnly();

    public void AddPitch(Pitch pitch)
    {
        _pitches.Add(pitch);
    }
}
