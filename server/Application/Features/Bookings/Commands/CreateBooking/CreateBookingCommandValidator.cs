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

        RuleForEach(x => x.SelectedServices)
            .ChildRules(service =>
            {
                service.RuleFor(x => x.ServiceId)
                    .NotEmpty()
                    .WithMessage("Service ID is required");

                service.RuleFor(x => x.Quantity)
                    .GreaterThan(0)
                    .WithMessage("Service quantity must be greater than zero");
            });
    }
}
