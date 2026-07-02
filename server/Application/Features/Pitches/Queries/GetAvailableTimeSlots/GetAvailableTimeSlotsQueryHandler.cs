using Application.Common.Interfaces;
using Application.Common.DTOs;
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
    private readonly IBookingLockRepository _bookingLockRepository;
    private readonly ICacheService _cacheService;
    private readonly IMapper _mapper;
    private readonly PricingDomainService _pricingService;
    private readonly ILogger<GetAvailableTimeSlotsQueryHandler> _logger;

    public GetAvailableTimeSlotsQueryHandler(
        ITimeSlotRepository timeSlotRepository,
        IBookingRepository bookingRepository,
        IBookingLockRepository bookingLockRepository,
        ICacheService cacheService,
        IMapper mapper,
        PricingDomainService pricingService,
        ILogger<GetAvailableTimeSlotsQueryHandler> logger)
    {
        _timeSlotRepository = timeSlotRepository;
        _bookingRepository = bookingRepository;
        _bookingLockRepository = bookingLockRepository;
        _cacheService = cacheService;
        _mapper = mapper;
        _pricingService = pricingService;
        _logger = logger;
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

        var vietnamNow = GetVietnamNow();
        var today = DateOnly.FromDateTime(vietnamNow.DateTime);
        var currentTime = TimeOnly.FromDateTime(vietnamNow.DateTime).ToTimeSpan();

        var timeSlotIds = timeSlots.Select(ts => ts.Id).ToList();
        var unavailableSlotIds = await _bookingRepository.GetUnavailableTimeSlotIdsAsync(
            timeSlotIds, request.Date, cancellationToken);
        var lockedSlotIds = await _bookingLockRepository.GetActiveLockedTimeSlotIdsAsync(
            timeSlotIds, request.Date, cancellationToken);

        var timeSlotDtos = new List<TimeSlotDto>();
        foreach (var ts in timeSlots)
        {
            var dto = _mapper.Map<TimeSlotDto>(ts);
            var isPastDate = request.Date < today;
            var isPastTime = request.Date == today && ts.TimeRange.StartTime <= currentTime;
            var isBooked = unavailableSlotIds.Contains(ts.Id);
            var isLocked = lockedSlotIds.Contains(ts.Id);
            dto.IsAvailable = ts.IsActive && !isPastDate && !isPastTime && !isBooked && !isLocked;
            
            // Apply dynamic pricing
            var effectivePrice = _pricingService.CalculateEffectivePrice(ts, request.Date);
            dto.Price = effectivePrice.Amount;
            
            timeSlotDtos.Add(dto);
        }

        return Result<List<TimeSlotDto>>.Success(timeSlotDtos);
    }

    private static DateTimeOffset GetVietnamNow()
    {
        try
        {
            return TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"));
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh"));
        }
    }
}
