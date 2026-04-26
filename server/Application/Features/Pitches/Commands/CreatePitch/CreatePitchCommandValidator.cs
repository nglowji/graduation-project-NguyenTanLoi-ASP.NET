using FluentValidation;

namespace Application.Features.Pitches.Commands.CreatePitch;

public class CreatePitchCommandValidator : AbstractValidator<CreatePitchCommand>
{
    public CreatePitchCommandValidator()
    {
        RuleFor(x => x.OwnerId)
            .NotEmpty()
            .WithMessage("Owner ID is required");

        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Pitch name is required")
            .MaximumLength(200)
            .WithMessage("Pitch name cannot exceed 200 characters");

        RuleFor(x => x.Street)
            .NotEmpty()
            .WithMessage("Street is required");

        RuleFor(x => x.City)
            .NotEmpty()
            .WithMessage("City is required");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90)
            .WithMessage("Latitude must be between -90 and 90");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180)
            .WithMessage("Longitude must be between -180 and 180");

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .When(x => !string.IsNullOrEmpty(x.Description))
            .WithMessage("Description cannot exceed 2000 characters");
    }
}
