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

        RuleFor(x => x.SportCenterId)
            .NotEmpty()
            .WithMessage("Sport Center ID is required");

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .When(x => !string.IsNullOrEmpty(x.Description))
            .WithMessage("Description cannot exceed 2000 characters");
    }
}
