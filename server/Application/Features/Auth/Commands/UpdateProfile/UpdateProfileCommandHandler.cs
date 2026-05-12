using Application.Common.Interfaces;
using Application.Common.DTOs;
using Domain.Entities;
using Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Auth.Commands.UpdateProfile;

public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, Result<Unit>>
{
    private readonly IApplicationDbContext _context;

    public UpdateProfileCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Unit>> Handle(UpdateProfileCommand request, CancellationToken ct)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, ct);

        if (user == null)
            return Result<Unit>.Failure("User not found");

        user.UpdateProfile(request.FullName, request.PhoneNumber, request.Address, request.MapLink);

        // If user is PitchOwner, update their SportCenter address too
        if (user.IsPitchOwner() && !string.IsNullOrWhiteSpace(request.Address))
        {
            var sportCenter = await _context.SportCenters
                .FirstOrDefaultAsync(sc => sc.OwnerId == request.UserId, ct);

            if (sportCenter != null)
            {
                try 
                {
                    // Attempt to parse/update address. 
                    // For simplicity, we'll use a basic parsing or just update the Street property if complex parsing fails.
                    var city = "Tỉnh/Thành phố";
                    var parts = request.Address.Split(',');
                    if (parts.Length > 0) city = parts.Last().Trim();

                    var newAddress = Address.Create(
                        request.Address, 
                        "Phường/Xã", 
                        "Quận/Huyện", 
                        city, 
                        10.0, 106.0 // Default coordinates
                    );
                    sportCenter.UpdateAddress(newAddress);
                }
                catch
                {
                    // If parsing fails, we skip updating the SportCenter address for now 
                    // or handle it more gracefully.
                }
            }
        }

        await _context.SaveChangesAsync(ct);
        return Result<Unit>.Success(Unit.Value);
    }
}
