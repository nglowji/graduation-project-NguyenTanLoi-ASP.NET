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
            .ForMember(dest => dest.AverageRating, opt => opt.MapFrom(src =>
                src.Reviews.Any() ? src.Reviews.Average(review => (decimal)review.Rating) : 0m))
            .ForMember(dest => dest.TotalReviews, opt => opt.MapFrom(src => src.Reviews.Count))
            .ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.SportCenter != null ? src.SportCenter.Address : null))
            .ForMember(dest => dest.Images, opt => opt.MapFrom(src =>
                src.Images
                    .OrderByDescending(img => img.IsPrimary)
                    .ThenBy(img => img.DisplayOrder)))
            .ForMember(dest => dest.MinPrice, opt => opt.MapFrom(src =>
                src.TimeSlots.Any() ? src.TimeSlots.Min(ts => ts.Price.Amount) : (decimal?)null))
            .ForMember(dest => dest.MaxPrice, opt => opt.MapFrom(src =>
                src.TimeSlots.Any() ? src.TimeSlots.Max(ts => ts.Price.Amount) : (decimal?)null));

        CreateMap<Pitch, PitchDetailDto>()
            .IncludeBase<Pitch, PitchDto>()
            .ForMember(dest => dest.TimeSlots, opt => opt.MapFrom(src => src.TimeSlots))
            .ForMember(dest => dest.Reviews, opt => opt.MapFrom(src =>
                src.Reviews
                    .OrderByDescending(review => review.CreatedAt)
                    .Take(10)));

        CreateMap<Domain.ValueObjects.Address, AddressDto>()
            .ForMember(dest => dest.FullAddress, opt => opt.MapFrom(src => src.GetFullAddress()));

        CreateMap<PitchImage, PitchImageDto>();

        CreateMap<TimeSlot, TimeSlotDto>()
            .ForMember(dest => dest.StartTime, opt => opt.MapFrom(src => src.TimeRange.StartTime))
            .ForMember(dest => dest.EndTime, opt => opt.MapFrom(src => src.TimeRange.EndTime))
            .ForMember(dest => dest.Price, opt => opt.MapFrom(src => src.Price.Amount))
            .ForMember(dest => dest.Currency, opt => opt.MapFrom(src => src.Price.Currency));

        CreateMap<Review, ReviewDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src =>
                src.User != null && !string.IsNullOrWhiteSpace(src.User.FullName)
                    ? src.User.FullName
                    : "Người dùng SmartSport"));
    }
}
