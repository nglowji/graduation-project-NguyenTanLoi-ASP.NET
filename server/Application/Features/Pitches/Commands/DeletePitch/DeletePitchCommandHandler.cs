using Application.Common.Interfaces;
using Application.Common.DTOs;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Pitches.Commands.DeletePitch;

public class DeletePitchCommandHandler : IRequestHandler<DeletePitchCommand, Result<Unit>>
{
    private readonly IPitchRepository _pitchRepository;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<DeletePitchCommandHandler> _logger;

    public DeletePitchCommandHandler(
        IPitchRepository pitchRepository,
        IApplicationDbContext context,
        ILogger<DeletePitchCommandHandler> logger)
    {
        _pitchRepository = pitchRepository;
        _context = context;
        _logger = logger;
    }

    public async Task<Result<Unit>> Handle(DeletePitchCommand request, CancellationToken cancellationToken)
    {
        var pitch = await _pitchRepository.GetByIdAsync(request.Id, cancellationToken);
        if (pitch == null)
            return Result<Unit>.Failure("Pitch not found");

        if (pitch.OwnerId != request.OwnerId)
            return Result<Unit>.Failure("You are not authorized to delete this pitch");

        pitch.SoftDelete();

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Pitch {PitchId} deleted by owner {OwnerId}", pitch.Id, request.OwnerId);

        return Result<Unit>.Success(MediatR.Unit.Value);
    }
}
