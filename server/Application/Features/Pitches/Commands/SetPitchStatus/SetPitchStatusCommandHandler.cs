using Application.Common.DTOs;
using Application.Common.Interfaces;
using Domain.Enums;
using Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Pitches.Commands.SetPitchStatus;

public class SetPitchStatusCommandHandler : IRequestHandler<SetPitchStatusCommand, Result<Unit>>
{
    private readonly IApplicationDbContext _context;

    public SetPitchStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Unit>> Handle(SetPitchStatusCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var pitch = await _context.Pitches
                .FirstOrDefaultAsync(item => item.Id == request.Id, cancellationToken);

            if (pitch == null)
                return Result<Unit>.Failure("Sân không tồn tại.");

            if (pitch.OwnerId != request.OwnerId)
                return Result<Unit>.Failure("Bạn không có quyền cập nhật sân này.");

            if (request.IsActive && pitch.Status == PitchStatus.PendingApproval)
                return Result<Unit>.Failure("Sân đang chờ admin duyệt nên chưa thể kích hoạt.");

            if (request.IsActive)
                pitch.Activate();
            else
                pitch.Deactivate();

            await _context.SaveChangesAsync(cancellationToken);
            return Result<Unit>.Success(Unit.Value);
        }
        catch (DomainException ex)
        {
            return Result<Unit>.Failure(ex.Message);
        }
    }
}
