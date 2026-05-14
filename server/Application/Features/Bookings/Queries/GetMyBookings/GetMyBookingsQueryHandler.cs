using Application.Common.Interfaces;
using Application.Common.DTOs;
using Application.Features.Bookings.DTOs;
using AutoMapper;
using Domain.Enums;
using MediatR;

namespace Application.Features.Bookings.Queries.GetMyBookings;

public class GetMyBookingsQueryHandler : IRequestHandler<GetMyBookingsQuery, Result<PagedResult<BookingDto>>>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IMapper _mapper;

    public GetMyBookingsQueryHandler(IBookingRepository bookingRepository, IMapper mapper)
    {
        _bookingRepository = bookingRepository;
        _mapper = mapper;
    }

    public async Task<Result<PagedResult<BookingDto>>> Handle(
        GetMyBookingsQuery request,
        CancellationToken cancellationToken)
    {
        BookingStatus? status = null;
        if (!string.IsNullOrWhiteSpace(request.Status)
            && Enum.TryParse<BookingStatus>(request.Status, true, out var parsed))
        {
            status = parsed;
        }

        var paged = await _bookingRepository.GetByUserIdAsync(
            request.UserId,
            request.PageNumber,
            request.PageSize,
            status,
            cancellationToken);

        var dtos = paged.Items
            .Select(b => _mapper.Map<BookingDto>(b))
            .ToList();

        var result = new PagedResult<BookingDto>(dtos, paged.TotalCount, paged.PageNumber, paged.PageSize);
        return Result<PagedResult<BookingDto>>.Success(result);
    }
}
