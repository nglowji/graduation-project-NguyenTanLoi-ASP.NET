using Application.Common.Interfaces;
using Application.Common.Models;
using Application.Features.Bookings.DTOs;
using AutoMapper;
using MediatR;

namespace Application.Features.Bookings.Queries.GetBookingById;

public class GetBookingByIdQueryHandler : IRequestHandler<GetBookingByIdQuery, Result<BookingDto>>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IMapper _mapper;

    public GetBookingByIdQueryHandler(IBookingRepository bookingRepository, IMapper mapper)
    {
        _bookingRepository = bookingRepository;
        _mapper = mapper;
    }

    public async Task<Result<BookingDto>> Handle(GetBookingByIdQuery request, CancellationToken cancellationToken)
    {
        var booking = await _bookingRepository.GetWithDetailsAsync(request.BookingId, cancellationToken);

        if (booking == null)
        {
            return Result<BookingDto>.Failure("Booking not found");
        }

        var bookingDto = _mapper.Map<BookingDto>(booking);
        return Result<BookingDto>.Success(bookingDto);
    }
}
