using Application.Features.Pitches.DTOs;
using AutoMapper;
using Domain.Entities;

namespace Application.Features.Pitches;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Pitch, PitchDto>()
            .ForMember(dest => dest.TypeDisplay, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.Address))
            .ForMember(dest => dest.Images, opt => opt.MapFrom(src => src.Images))
            .ForMember(dest => dest.MinPrice, opt => opt.MapFrom(src =>
                src.TimeSlots.Any() ? src.TimeSlots.Min(ts => ts.Price.Amount) : (decimal?)null))
            .ForMember(dest => dest.MaxPrice, opt => opt.MapFrom(src =>
                src.TimeSlots.Any() ? src.TimeSlots.Max(ts => ts.Price.Amount) : (decimal?)null));

        CreateMap<Pitch, PitchDetailDto>()
            .IncludeBase<Pitch, PitchDto>()
            .ForMember(dest => dest.TimeSlots, opt => opt.MapFrom(src => src.TimeSlots));

        CreateMap<Domain.ValueObjects.Address, AddressDto>()
            .ForMember(dest => dest.FullAddress, opt => opt.MapFrom(src => src.GetFullAddress()));

        CreateMap<PitchImage, PitchImageDto>();

        CreateMap<TimeSlot, TimeSlotDto>()
            .ForMember(dest => dest.StartTime, opt => opt.MapFrom(src => src.TimeRange.StartTime.ToString(@"hh\:mm")))
            .ForMember(dest => dest.EndTime, opt => opt.MapFrom(src => src.TimeRange.EndTime.ToString(@"hh\:mm")))
            .ForMember(dest => dest.Price, opt => opt.MapFrom(src => src.Price.Amount))
            .ForMember(dest => dest.Currency, opt => opt.MapFrom(src => src.Price.Currency));

        CreateMap<Review, ReviewDto>()
            .ForMember(dest => dest.UserName, opt => opt.Ignore()); // Will be populated separately
    }
}
