using Application.Common.Interfaces;
using Application.Common.Models;
using Application.Features.Pitches.DTOs;
using Domain.Services;
using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.Pitches.Queries.GetAvailableTimeSlots;

public class GetAvailableTimeSlotsQueryHandler 
    : IRequestHandler<GetAvailableTimeSlotsQuery, Result<List<TimeSlotDto>>>
{
    private readonly ITimeSlotRepository _timeSlotRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly ICacheService _cacheService;
    private readonly IMapper _mapper;
    private readonly PricingDomainService _pricingService;
    private readonly ILogger<GetAvailableTimeSlotsQueryHandler> _logger;

    public GetAvailableTimeSlotsQueryHandler(
        ITimeSlotRepository timeSlotRepository,
        IBookingRepository bookingRepository,
        ICacheService cacheService,
        IMapper mapper,
        PricingDomainService pricingService,
        ILogger<GetAvailableTimeSlotsQueryHandler> logger)
    {
        _timeSlotRepository = timeSlotRepository;
        _bookingRepository = bookingRepository;
        _cacheService = cacheService;
        _mapper = mapper;
        _pricingService = pricingService;
        _logger = logger;
    }

    public async Task<Result<List<TimeSlotDto>>> Handle(
        GetAvailableTimeSlotsQuery request,
        CancellationToken cancellationToken)
    {
        var cacheKey = $"available_slots_{request.PitchId}_{request.Date:yyyyMMdd}";
        var cachedSlots = await _cacheService.GetAsync<List<TimeSlotDto>>(cacheKey, cancellationToken);

        if (cachedSlots != null)
        {
            return Result<List<TimeSlotDto>>.Success(cachedSlots);
        }

        var timeSlots = await _timeSlotRepository.GetAvailableByPitchIdAsync(
            request.PitchId,
            request.Date,
            cancellationToken
        );

        var timeSlotDtos = timeSlots.Select(ts =>
        {
            var dto = _mapper.Map<TimeSlotDto>(ts);
            dto.IsAvailable = ts.IsAvailableOn(request.Date);
            
            // Apply dynamic pricing
            var effectivePrice = _pricingService.CalculateEffectivePrice(ts, request.Date);
            dto.Price = effectivePrice.Amount;
            
            return dto;
        }).ToList();

        await _cacheService.SetAsync(cacheKey, timeSlotDtos, TimeSpan.FromMinutes(10), cancellationToken);

        return Result<List<TimeSlotDto>>.Success(timeSlotDtos);
    }
}
