using FluentValidation;

namespace Application.Features.Bookings.Commands.CreateBooking;

public class CreateBookingCommandValidator : AbstractValidator<CreateBookingCommand>
{
    public CreateBookingCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("User ID is required");

        RuleFor(x => x.TimeSlotId)
            .NotEmpty()
            .WithMessage("Time slot ID is required");

        RuleFor(x => x.BookingDate)
            .GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Booking date must be today or in the future");
    }
}
