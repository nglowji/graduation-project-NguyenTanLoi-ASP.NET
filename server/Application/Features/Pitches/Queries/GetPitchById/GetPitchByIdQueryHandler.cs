using Application.Common.Interfaces;
using Application.Common.DTOs;
using Application.Features.Pitches.DTOs;
using AutoMapper;
using MediatR;

namespace Application.Features.Pitches.Queries.GetPitchById;

public class GetPitchByIdQueryHandler : IRequestHandler<GetPitchByIdQuery, Result<PitchDetailDto>>
{
    private readonly IPitchRepository _pitchRepository;
    private readonly IMapper _mapper;

    public GetPitchByIdQueryHandler(IPitchRepository pitchRepository, IMapper mapper)
    {
        _pitchRepository = pitchRepository;
        _mapper = mapper;
    }

    public async Task<Result<PitchDetailDto>> Handle(
        GetPitchByIdQuery request,
        CancellationToken cancellationToken)
    {
        var pitch = await _pitchRepository.GetWithTimeSlotsAsync(request.PitchId, cancellationToken);
        if (pitch == null)
            return Result<PitchDetailDto>.Failure("Pitch not found");

        var dto = _mapper.Map<PitchDetailDto>(pitch);
        dto.TypeDisplay = pitch.Type switch
        {
            Domain.Enums.PitchType.Football5 => "Football 5",
            Domain.Enums.PitchType.Football7 => "Football 7",
            Domain.Enums.PitchType.Football11 => "Football 11",
            Domain.Enums.PitchType.Tennis => "Tennis",
            Domain.Enums.PitchType.Badminton => "Badminton",
            Domain.Enums.PitchType.Pickleball => "Pickleball",
            Domain.Enums.PitchType.Basketball => "Basketball",
            Domain.Enums.PitchType.Volleyball => "Volleyball",
            Domain.Enums.PitchType.TableTennis => "Table tennis",
            _ => "Football 5"
        };
        return Result<PitchDetailDto>.Success(dto);
    }
}
