using FluentValidation;

namespace Application.Features.Payments.Commands.CreatePayment;

public class CreatePaymentCommandValidator : AbstractValidator<CreatePaymentCommand>
{
    public CreatePaymentCommandValidator()
    {
        RuleFor(x => x.BookingId)
            .NotEmpty()
            .WithMessage("Booking ID is required");

        RuleFor(x => x.ReturnUrl)
            .NotEmpty()
            .WithMessage("Return URL is required")
            .Must(BeAValidUrl)
            .WithMessage("Return URL must be a valid URL");

        RuleFor(x => x.IpAddress)
            .NotEmpty()
            .WithMessage("IP address is required");
    }

    private static bool BeAValidUrl(string url)
    {
        return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
            && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }
}
