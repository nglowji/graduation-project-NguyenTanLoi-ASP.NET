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

        RuleFor(x => x.Provider)
            .NotEmpty()
            .WithMessage("Payment provider is required")
            .Must(provider => provider.Equals("VNPAY", StringComparison.OrdinalIgnoreCase)
                || provider.Equals("ZALOPAY", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Payment provider must be VNPAY or ZALOPAY");

        When(x => x.Provider.Equals("ZALOPAY", StringComparison.OrdinalIgnoreCase), () =>
        {
            RuleFor(x => x.CallbackUrl)
                .NotEmpty()
                .WithMessage("Callback URL is required for ZaloPay")
                .Must(url => url is not null && BeAValidUrl(url))
                .WithMessage("Callback URL must be a valid URL");
        });
    }

    private static bool BeAValidUrl(string url)
    {
        return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
            && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }
}
