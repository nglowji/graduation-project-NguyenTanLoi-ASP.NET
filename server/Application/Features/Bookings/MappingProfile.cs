using Application.Features.Bookings.DTOs;
using AutoMapper;
using Domain.Entities;

namespace Application.Features.Bookings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Booking, BookingDto>()
            .ForMember(dest => dest.TotalPrice, opt => opt.MapFrom(src => src.TotalPrice.Amount))
            .ForMember(dest => dest.DepositAmount, opt => opt.MapFrom(src => src.DepositAmount.Amount))
            .ForMember(dest => dest.Currency, opt => opt.MapFrom(src => src.TotalPrice.Currency));

        CreateMap<TimeSlot, TimeSlotDto>()
            .ForMember(dest => dest.StartTime, opt => opt.MapFrom(src => src.TimeRange.StartTime.ToString(@"hh\:mm")))
            .ForMember(dest => dest.EndTime, opt => opt.MapFrom(src => src.TimeRange.EndTime.ToString(@"hh\:mm")))
            .ForMember(dest => dest.Price, opt => opt.MapFrom(src => src.Price.Amount))
            .ForMember(dest => dest.Currency, opt => opt.MapFrom(src => src.Price.Currency));

        CreateMap<Pitch, PitchDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.Address.GetFullAddress()));
    }
}
