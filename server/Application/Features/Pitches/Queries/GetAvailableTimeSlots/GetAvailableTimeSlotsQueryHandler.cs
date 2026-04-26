using Application.Common.Interfaces;
using Application.Common.Models;
using Application.Features.Pitches.DTOs;
using AutoMapper;
using MediatR;

namespace Application.Features.Pitches.Queries.GetAvailableTimeSlots;

public class GetAvailableTimeSlotsQueryHandler 
    : IRequestHandler<GetAvailableTimeSlotsQuery, Result<List<TimeSlotDto>>>
{
    private readonly ITimeSlotRepository _timeSlotRepository;
    private readonly IMapper _mapper;

    public GetAvailableTimeSlotsQueryHandler(
        ITimeSlotRepository timeSlotRepository,
        IMapper mapper)
    {
        _timeSlotRepository = timeSlotRepository;
        _mapper = mapper;
    }

    public async Task<Result<List<TimeSlotDto>>> Handle(
        GetAvailableTimeSlotsQuery request,
        CancellationToken cancellationToken)
    {
        var timeSlots = await _timeSlotRepository.GetAvailableByPitchIdAsync(
            request.PitchId,
            request.Date,
            cancellationToken
        );

        var timeSlotDtos = timeSlots.Select(ts =>
        {
            var dto = _mapper.Map<TimeSlotDto>(ts);
            dto.IsAvailable = ts.IsAvailableOn(request.Date);
            return dto;
        }).ToList();

        return Result<List<TimeSlotDto>>.Success(timeSlotDtos);
    }
}
