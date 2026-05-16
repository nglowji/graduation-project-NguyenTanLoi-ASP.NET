using FluentValidation;

namespace Application.Features.Auth.Commands.Register;

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Email là bắt buộc.")
            .EmailAddress()
            .WithMessage("Email không đúng định dạng.")
            .MaximumLength(255)
            .WithMessage("Email không được vượt quá 255 ký tự.");

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("Mật khẩu là bắt buộc.")
            .MinimumLength(8)
            .WithMessage("Mật khẩu phải có ít nhất 8 ký tự.")
            .Matches(@"[A-Z]")
            .WithMessage("Mật khẩu phải có ít nhất 1 chữ hoa.")
            .Matches(@"[a-z]")
            .WithMessage("Mật khẩu phải có ít nhất 1 chữ thường.")
            .Matches(@"[0-9]")
            .WithMessage("Mật khẩu phải có ít nhất 1 chữ số.")
            .Matches(@"[\W_]")
            .WithMessage("Mật khẩu phải có ít nhất 1 ký tự đặc biệt.");

        RuleFor(x => x.FullName)
            .NotEmpty()
            .WithMessage("Họ và tên là bắt buộc.")
            .MaximumLength(200)
            .WithMessage("Họ và tên không được vượt quá 200 ký tự.");

        RuleFor(x => x.PhoneNumber)
            .NotEmpty()
            .WithMessage("Số điện thoại là bắt buộc.")
            .Matches(@"^(\+84|0)[0-9]{9,10}$")
            .WithMessage("Số điện thoại không đúng định dạng Việt Nam.");
    }
}
