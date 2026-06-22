using Application.Common.DTOs;
using Application.Features.Pitches.Commands.CreatePitch;
using Application.Features.Pitches.Commands.UpdatePitch;
using Application.Features.Pitches.Commands.DeletePitch;
using Application.Features.Pitches.Commands.SetPitchStatus;
using Application.Features.Pitches.DTOs;
using Application.Features.Pitches.Queries.GetAvailableTimeSlots;
using Application.Features.Pitches.Queries.GetPitchById;
using Application.Features.Pitches.Queries.SearchPitches;
using Application.Features.Dashboard.Queries;
using Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace Api.Controllers;

[Route("api/v1/[controller]")]
public class PitchesController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public PitchesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PitchDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Search(
        [FromQuery] string? searchTerm,
        [FromQuery] PitchType? type,
        [FromQuery] string? sportType,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] string? province,
        [FromQuery] string? district,
        [FromQuery] string? ward,
        [FromQuery] decimal? minRating,
        [FromQuery] double? latitude,
        [FromQuery] double? longitude,
        [FromQuery] double? radiusKm,
        [FromQuery] string? sortBy,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new SearchPitchesQuery(
            searchTerm, type, sportType, minPrice, maxPrice,
            province, district, ward, minRating,
            latitude, longitude, radiusKm,
            sortBy,
            pageNumber, pageSize
        );

        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Search failed");

        return OkResponse(result.Value);
    }

    [HttpGet("{pitchId:guid}/available-slots")]
    [HttpGet("{pitchId:guid}/timeslots")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<List<TimeSlotDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAvailableTimeSlots(
        Guid pitchId,
        [FromQuery] DateOnly date,
        CancellationToken cancellationToken)
    {
        var query = new GetAvailableTimeSlotsQuery(pitchId, date);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get available slots");

        return OkResponse(result.Value);
    }

    [HttpGet("{pitchId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<PitchDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        Guid pitchId,
        CancellationToken cancellationToken)
    {
        var query = new GetPitchByIdQuery(pitchId);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return NotFoundResponse(result.ErrorMessage ?? "Pitch not found");

        return OkResponse(result.Value);
    }

    [HttpGet("resolve-map-link")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<MapLinkResolveResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResolveMapLink([FromQuery] string url, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(url))
            return BadRequestResponse("Map link is required");

        var resolved = await GoogleMapLinkResolver.ResolveAsync(url.Trim(), cancellationToken);
        if (resolved == null)
            return BadRequestResponse("Không thể xác định tọa độ từ link bản đồ.");

        return OkResponse(resolved);
    }

    [HttpPost]
    [Authorize(Policy = "OwnerOrAdmin")]
    [ProducesResponseType(typeof(ApiResponse<Guid>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePitchCommand command,
        CancellationToken cancellationToken)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        var commandWithOwner = command with { OwnerId = ownerId };
        var result = await _mediator.Send(commandWithOwner, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to create pitch");

        return OkResponse(result.Value, "Pitch created successfully");
    }

    [HttpPost("images")]
    [Authorize(Policy = "OwnerOrAdmin")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> UploadImage(IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequestResponse("Vui lòng chọn một ảnh hợp lệ.");

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
            return BadRequestResponse("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension is not ".jpg" and not ".jpeg" and not ".png" and not ".webp")
            return BadRequestResponse("Định dạng ảnh không hợp lệ.");

        var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "pitches");
        Directory.CreateDirectory(uploadsPath);
        var storedFileName = $"{Guid.NewGuid():N}{extension}";
        var storedPath = Path.Combine(uploadsPath, storedFileName);

        await using (var stream = System.IO.File.Create(storedPath))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var imageUrl = $"{Request.Scheme}://{Request.Host}/uploads/pitches/{storedFileName}";
        return OkResponse(new { imageUrl });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "OwnerOrAdmin")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdatePitchCommand command,
        CancellationToken cancellationToken)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        var commandWithIds = command with { Id = id, OwnerId = ownerId };
        var result = await _mediator.Send(commandWithIds, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to update pitch");

        return OkResponse<object?>(null, "Pitch updated successfully");
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "OwnerOrAdmin")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        var command = new DeletePitchCommand(id, ownerId);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to delete pitch");

        return OkResponse<object?>(null, "Pitch deleted successfully");
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = "OwnerOrAdmin")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetStatus(
        Guid id,
        [FromBody] SetPitchStatusRequest request,
        CancellationToken cancellationToken)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        var command = new SetPitchStatusCommand(id, ownerId, request.IsActive);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to update pitch status");

        return OkResponse<object?>(null, request.IsActive ? "Pitch activated successfully" : "Pitch paused successfully");
    }

    [HttpGet("my")]
    [Authorize(Roles = "PitchOwner")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetMyPitches(CancellationToken cancellationToken = default)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty) return Unauthorized();

        var query = new GetOwnerPitchesQuery(ownerId);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get my pitches");

        return OkResponse(result.Value);
    }
}

public record SetPitchStatusRequest(bool IsActive);
public record MapLinkResolveResponse(double Latitude, double Longitude, string ExpandedUrl);

internal static class GoogleMapLinkResolver
{
    public static async Task<MapLinkResolveResponse?> ResolveAsync(string input, CancellationToken cancellationToken)
    {
        var direct = TryExtractCoordinates(input, input);
        if (direct != null)
            return direct;

        if (!Uri.TryCreate(input, UriKind.Absolute, out var uri))
            return null;

        var allowedHosts = new[]
        {
            "maps.app.goo.gl",
            "goo.gl",
            "www.google.com",
            "google.com",
            "maps.google.com"
        };

        if (!allowedHosts.Any(host => uri.Host.Equals(host, StringComparison.OrdinalIgnoreCase)))
            return null;

        using var handler = new HttpClientHandler { AllowAutoRedirect = true, MaxAutomaticRedirections = 10 };
        using var httpClient = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(10) };
        httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 SmartSport/1.0");

        using var response = await httpClient.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        var expandedUrl = response.RequestMessage?.RequestUri?.ToString() ?? input;
        return TryExtractCoordinates(expandedUrl, expandedUrl);
    }

    private static MapLinkResolveResponse? TryExtractCoordinates(string value, string expandedUrl)
    {
        var decoded = Uri.UnescapeDataString(value.Replace("+", " "));
        var patterns = new[]
        {
            @"@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)",
            @"[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)",
            @"!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)"
        };

        foreach (var pattern in patterns)
        {
            var match = Regex.Match(decoded, pattern, RegexOptions.IgnoreCase);
            if (!match.Success)
                continue;

            if (double.TryParse(match.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture, out var latitude)
                && double.TryParse(match.Groups[2].Value, System.Globalization.CultureInfo.InvariantCulture, out var longitude))
            {
                return new MapLinkResolveResponse(latitude, longitude, expandedUrl);
            }
        }

        return null;
    }
}
