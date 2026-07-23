using FluentValidation;

namespace Application.Features.Bookings.Commands.CreateMultiSlotBooking;

public class CreateMultiSlotBookingCommandValidator : AbstractValidator<CreateMultiSlotBookingCommand>
{
    public CreateMultiSlotBookingCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("User ID là bắt buộc.");

        RuleFor(x => x.TimeSlots)
            .NotEmpty()
            .WithMessage("Vui lòng chọn ít nhất một khung giờ.")
            .Must(slots => slots != null && slots.Count <= 10)
            .WithMessage("Chỉ được đặt tối đa 10 khung giờ cùng lúc.");

        RuleForEach(x => x.TimeSlots).ChildRules(slot =>
        {
            slot.RuleFor(s => s.TimeSlotId)
                .NotEmpty()
                .WithMessage("Time Slot ID là bắt buộc.");

            slot.RuleFor(s => s.BookingDate)
                .GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
                .WithMessage("Không thể đặt sân cho ngày trong quá khứ.");
        });

        When(x => x.SelectedServices != null, () =>
        {
            RuleForEach(x => x.SelectedServices).ChildRules(service =>
            {
                service.RuleFor(s => s.ServiceId)
                    .NotEmpty()
                    .WithMessage("Service ID là bắt buộc.");

                service.RuleFor(s => s.Quantity)
                    .GreaterThan(0)
                    .WithMessage("Số lượng dịch vụ phải lớn hơn 0.");
            });
        });
    }
}
