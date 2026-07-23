namespace Application.Common.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body, CancellationToken cancellationToken = default);
    
    Task SendMultiSlotBookingConfirmationAsync(
        string email, 
        string userName, 
        string pitchName, 
        int slotCount, 
        DateOnly bookingDate, 
        CancellationToken cancellationToken = default);
}
