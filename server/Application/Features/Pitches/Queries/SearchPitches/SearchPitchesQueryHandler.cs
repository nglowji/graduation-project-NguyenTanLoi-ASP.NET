using Application.Common.Interfaces;
using Application.Common.DTOs;
using Application.Features.Pitches.DTOs;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Pitches.Queries.SearchPitches;

public class SearchPitchesQueryHandler : IRequestHandler<SearchPitchesQuery, Result<PagedResult<PitchDto>>>
{
    private readonly IPitchRepository _pitchRepository;
    private readonly IMapper _mapper;

    public SearchPitchesQueryHandler(IPitchRepository pitchRepository, IMapper mapper)
    {
        _pitchRepository = pitchRepository;
        _mapper = mapper;
    }

    public async Task<Result<PagedResult<PitchDto>>> Handle(
        SearchPitchesQuery request,
        CancellationToken cancellationToken)
    {
        var pageNumber = Math.Max(request.PageNumber, 1);
        var pageSize = Math.Clamp(request.PageSize, 1, 40);
        var query = _pitchRepository.AsQueryable();

        // 1. Apply Filters (at Database level)
        query = ApplyFilters(query, request);

        // 2. Count Total (at Database level)
        var totalCount = await query.CountAsync(cancellationToken);

        // 3. Apply Sorting and Pagination (at Database level)
        var pagedQuery = ApplySorting(query, request.SortBy)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize);

        // 4. Project to DTO (at Database level - No SELECT *)
        var items = await pagedQuery
            .ProjectTo<PitchDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        foreach (var item in items)
        {
            item.TypeDisplay = GetPitchTypeDisplay(item.Type);
        }

        var result = new PagedResult<PitchDto>(
            items,
            totalCount,
            pageNumber,
            pageSize
        );

        return Result<PagedResult<PitchDto>>.Success(result);
    }

    private static IQueryable<Domain.Entities.Pitch> ApplyFilters(
        IQueryable<Domain.Entities.Pitch> query,
        SearchPitchesQuery request)
    {
        var filtered = query.Where(p => p.Status == Domain.Enums.PitchStatus.Active);
        var province = NormalizeLocationFilter(request.Province);
        var district = NormalizeLocationFilter(request.District);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            filtered = filtered.Where(p =>
                p.Name.Contains(request.SearchTerm) ||
                (p.Description != null && p.Description.Contains(request.SearchTerm)) ||
                (p.SportCenter != null &&
                    (p.SportCenter.Name.Contains(request.SearchTerm) ||
                     p.SportCenter.Address.Street.Contains(request.SearchTerm) ||
                     p.SportCenter.Address.District.Contains(request.SearchTerm) ||
                     p.SportCenter.Address.City.Contains(request.SearchTerm)))
            );
        }

        if (request.Type.HasValue)
        {
            filtered = filtered.Where(p => p.Type == request.Type.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.SportType))
        {
            if (request.SportType.Equals("Football", StringComparison.OrdinalIgnoreCase))
            {
                filtered = filtered.Where(p => 
                    (int)p.Type == 0 ||
                    p.Type == Domain.Enums.PitchType.Football5 || 
                    p.Type == Domain.Enums.PitchType.Football7 || 
                    p.Type == Domain.Enums.PitchType.Football11);
            }
            else if (Enum.TryParse<Domain.Enums.PitchType>(request.SportType, true, out var parsedType))
            {
                filtered = filtered.Where(p => p.Type == parsedType);
            }
        }

        if (!string.IsNullOrWhiteSpace(province))
        {
            var provinceAliases = GetProvinceAliases(province);
            filtered = filtered.Where(p => p.SportCenter != null && 
                (provinceAliases.Contains(p.SportCenter.Address.City) ||
                 p.SportCenter.Address.City.Contains(province) ||
                 EF.Functions.Like(p.SportCenter.Address.City, $"%{province}%")));
        }

        if (!string.IsNullOrWhiteSpace(district))
        {
            filtered = filtered.Where(p => p.SportCenter != null && 
                (p.SportCenter.Address.District == district ||
                 p.SportCenter.Address.District.Contains(district) ||
                 EF.Functions.Like(p.SportCenter.Address.District, $"%{district}%")));
        }

        if (request.MinRating.HasValue)
        {
            filtered = filtered.Where(p =>
                p.Reviews.Any() &&
                p.Reviews.Average(review => review.Rating) >= (double)request.MinRating.Value);
        }

        if (request.MinPrice.HasValue || request.MaxPrice.HasValue)
        {
            filtered = filtered.Where(p => p.TimeSlots.Any(ts =>
                (!request.MinPrice.HasValue || ts.Price.Amount >= request.MinPrice.Value) &&
                (!request.MaxPrice.HasValue || ts.Price.Amount <= request.MaxPrice.Value)
            ));
        }

        // Geospatial filtering if coordinates provided
        if (request.Latitude.HasValue && request.Longitude.HasValue && request.RadiusKm.HasValue)
        {
            // Note: For production with large datasets, use spatial types (NetTopologySuite)
            // This is a simplified version that still runs at DB level for some providers
            // If not supported by provider, this might need a stored procedure or special spatial query
            // For now, we'll use a bounding box approach as a senior optimization
            double latRange = request.RadiusKm.Value / 111.0;
            double lonRange = request.RadiusKm.Value / (111.0 * Math.Cos(request.Latitude.Value * Math.PI / 180.0));

            filtered = filtered.Where(p => 
                p.SportCenter != null &&
                p.SportCenter.Address.Latitude >= request.Latitude.Value - latRange &&
                p.SportCenter.Address.Latitude <= request.Latitude.Value + latRange &&
                p.SportCenter.Address.Longitude >= request.Longitude.Value - lonRange &&
                p.SportCenter.Address.Longitude <= request.Longitude.Value + lonRange
            );
        }

        return filtered;
    }

    private static string? NormalizeLocationFilter(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;

        var normalized = value.Trim();
        foreach (var prefix in new[] { "Tỉnh ", "Thành phố ", "TP. ", "TP ", "Quận ", "Huyện ", "Thị xã " })
        {
            if (normalized.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                normalized = normalized[prefix.Length..].Trim();
                break;
            }
        }

        return normalized;
    }

    private static string[] GetProvinceAliases(string province)
    {
        var normalized = NormalizeLocationFilter(province) ?? province;
        var aliases = normalized switch
        {
            "Hồ Chí Minh" => new[] { "Thành phố Hồ Chí Minh", "Hồ Chí Minh", "Tỉnh Bình Dương", "Bình Dương", "Tỉnh Bà Rịa - Vũng Tàu", "Bà Rịa - Vũng Tàu" },
            "Hải Phòng" => new[] { "Thành phố Hải Phòng", "Hải Phòng", "Tỉnh Hải Dương", "Hải Dương" },
            "Đà Nẵng" => new[] { "Thành phố Đà Nẵng", "Đà Nẵng", "Tỉnh Quảng Nam", "Quảng Nam" },
            "Huế" => new[] { "Thành phố Huế", "Huế", "Tỉnh Thừa Thiên Huế", "Thừa Thiên Huế" },
            "Cần Thơ" => new[] { "Thành phố Cần Thơ", "Cần Thơ", "Tỉnh Sóc Trăng", "Sóc Trăng", "Tỉnh Hậu Giang", "Hậu Giang" },
            "Tuyên Quang" => new[] { "Tỉnh Tuyên Quang", "Tuyên Quang", "Tỉnh Hà Giang", "Hà Giang" },
            "Lào Cai" => new[] { "Tỉnh Lào Cai", "Lào Cai", "Tỉnh Yên Bái", "Yên Bái" },
            "Thái Nguyên" => new[] { "Tỉnh Thái Nguyên", "Thái Nguyên", "Tỉnh Bắc Kạn", "Bắc Kạn" },
            "Bắc Ninh" => new[] { "Tỉnh Bắc Ninh", "Bắc Ninh", "Tỉnh Bắc Giang", "Bắc Giang" },
            "Phú Thọ" => new[] { "Tỉnh Phú Thọ", "Phú Thọ", "Tỉnh Vĩnh Phúc", "Vĩnh Phúc", "Tỉnh Hòa Bình", "Hòa Bình" },
            "Hưng Yên" => new[] { "Tỉnh Hưng Yên", "Hưng Yên", "Tỉnh Thái Bình", "Thái Bình" },
            "Ninh Bình" => new[] { "Tỉnh Ninh Bình", "Ninh Bình", "Tỉnh Hà Nam", "Hà Nam", "Tỉnh Nam Định", "Nam Định" },
            "Quảng Trị" => new[] { "Tỉnh Quảng Trị", "Quảng Trị", "Tỉnh Quảng Bình", "Quảng Bình" },
            "Quảng Ngãi" => new[] { "Tỉnh Quảng Ngãi", "Quảng Ngãi", "Tỉnh Kon Tum", "Kon Tum" },
            "Gia Lai" => new[] { "Tỉnh Gia Lai", "Gia Lai", "Tỉnh Bình Định", "Bình Định" },
            "Đắk Lắk" => new[] { "Tỉnh Đắk Lắk", "Đắk Lắk", "Tỉnh Phú Yên", "Phú Yên" },
            "Khánh Hòa" => new[] { "Tỉnh Khánh Hòa", "Khánh Hòa", "Tỉnh Ninh Thuận", "Ninh Thuận" },
            "Lâm Đồng" => new[] { "Tỉnh Lâm Đồng", "Lâm Đồng", "Tỉnh Đắk Nông", "Đắk Nông", "Tỉnh Bình Thuận", "Bình Thuận" },
            "Đồng Nai" => new[] { "Tỉnh Đồng Nai", "Đồng Nai", "Tỉnh Bình Phước", "Bình Phước" },
            "Tây Ninh" => new[] { "Tỉnh Tây Ninh", "Tây Ninh", "Tỉnh Long An", "Long An" },
            "Đồng Tháp" => new[] { "Tỉnh Đồng Tháp", "Đồng Tháp", "Tỉnh Tiền Giang", "Tiền Giang" },
            "An Giang" => new[] { "Tỉnh An Giang", "An Giang", "Tỉnh Kiên Giang", "Kiên Giang" },
            "Vĩnh Long" => new[] { "Tỉnh Vĩnh Long", "Vĩnh Long", "Tỉnh Bến Tre", "Bến Tre", "Tỉnh Trà Vinh", "Trà Vinh" },
            "Cà Mau" => new[] { "Tỉnh Cà Mau", "Cà Mau", "Tỉnh Bạc Liêu", "Bạc Liêu" },
            _ => new[] { province, normalized, $"Tỉnh {normalized}", $"Thành phố {normalized}" }
        };

        return aliases.Distinct().ToArray();
    }

    private static IOrderedQueryable<Domain.Entities.Pitch> ApplySorting(
        IQueryable<Domain.Entities.Pitch> query,
        string? sortBy)
    {
        return sortBy?.ToLowerInvariant() switch
        {
            "price_asc" => query.OrderBy(p => p.TimeSlots.Where(ts => ts.IsActive).Select(ts => (decimal?)ts.Price.Amount).Min() ?? decimal.MaxValue)
                .ThenByDescending(p => p.Reviews.Any() ? p.Reviews.Average(review => review.Rating) : 0),
            "price_desc" => query.OrderByDescending(p => p.TimeSlots.Where(ts => ts.IsActive).Select(ts => (decimal?)ts.Price.Amount).Min() ?? 0)
                .ThenByDescending(p => p.Reviews.Any() ? p.Reviews.Average(review => review.Rating) : 0),
            "newest" => query.OrderByDescending(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.Reviews.Any() ? p.Reviews.Average(review => review.Rating) : 0).ThenByDescending(p => p.CreatedAt)
        };
    }

    private static string GetPitchTypeDisplay(Domain.Enums.PitchType type)
    {
        return type switch
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
    }
}
