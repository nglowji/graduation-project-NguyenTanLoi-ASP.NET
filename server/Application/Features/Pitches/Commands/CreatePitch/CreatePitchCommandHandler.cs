using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using Domain.ValueObjects;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Pitches.Commands.CreatePitch;

public class CreatePitchCommandHandler : IRequestHandler<CreatePitchCommand, Result<Guid>>
{
    private readonly IPitchRepository _pitchRepository;
    private readonly IUserRepository _userRepository;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CreatePitchCommandHandler> _logger;

    public CreatePitchCommandHandler(
        IPitchRepository pitchRepository,
        IUserRepository userRepository,
        IApplicationDbContext context,
        ILogger<CreatePitchCommandHandler> logger)
    {
        _pitchRepository = pitchRepository;
        _userRepository = userRepository;
        _context = context;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(CreatePitchCommand request, CancellationToken cancellationToken)
    {
        var owner = await _userRepository.GetByIdAsync(request.OwnerId, cancellationToken);
        if (owner == null)
            return Result<Guid>.Failure("Owner not found");

        if (!owner.IsPitchOwner() && !owner.IsAdmin())
            return Result<Guid>.Failure("User is not authorized to create pitches");

        var address = Address.Create(
            request.Street,
            request.Ward,
            request.District,
            request.City,
            request.Latitude,
            request.Longitude
        );

        var pitch = Pitch.Create(
            request.OwnerId,
            request.Name,
            request.Type,
            address,
            request.Description
        );

        await _pitchRepository.AddAsync(pitch, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Pitch {PitchId} created by owner {OwnerId}",
            pitch.Id,
            request.OwnerId
        );

        return Result<Guid>.Success(pitch.Id);
    }
}
