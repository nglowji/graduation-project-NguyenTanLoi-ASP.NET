using Application.Common.DTOs;
using Application.Features.Bookings.Commands.CancelBooking;
using Application.Features.Bookings.Commands.CompleteBooking;
using Application.Features.Bookings.Commands.ConfirmBooking;
using Application.Features.Bookings.Commands.CreateBooking;
using Application.Features.Bookings.Commands.CreateMultiSlotBooking;
using Application.Features.Bookings.Commands.LockTimeSlot;
using Application.Features.Bookings.Commands.ReleaseLock;
using Application.Features.Bookings.DTOs;
using Application.Features.Bookings.Queries.GetBookingById;
using Application.Features.Bookings.Queries.GetMyBookings;
using Application.Features.Dashboard.DTOs;
using Application.Features.Dashboard.Queries;
using Api.Contracts;
using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Domain.Entities;
using Domain.Enums;

namespace Api.Controllers;

[Route("api/v1/[controller]")]
[Authorize]
public class BookingsController : ApiControllerBase
{
    private readonly IMediator _mediator;
    private readonly IUserRepository _userRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IApplicationDbContext _context;

    public BookingsController(IMediator mediator, IUserRepository userRepository, IBookingRepository bookingRepository, IApplicationDbContext context)
    {
        _mediator = mediator;
        _userRepository = userRepository;
        _bookingRepository = bookingRepository;
        _context = context;
    }

    [HttpPost("lock")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LockTimeSlot(
        [FromBody] LockTimeSlotRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var command = new LockTimeSlotCommand(
            userId,
            request.TimeSlotId,
            request.BookingDate,
            request.LockDurationMinutes
        );

        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to lock time slot");

        return OkResponse(new
        {
            result.Value!.LockId,
            result.Value.ExpiresAt,
            result.Value.DurationMinutes,
            Message = "Time slot locked successfully"
        });
    }

    [HttpPost("release-lock/{lockId:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ReleaseLock(
        Guid lockId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var command = new ReleaseLockCommand(lockId, userId);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to release lock");

        return OkResponse<object?>(null, "Lock released successfully");
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<BookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetBookingByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return NotFoundResponse(result.ErrorMessage ?? "Booking not found");

        return OkResponse(result.Value);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<Guid>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateBookingRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var command = new CreateBookingCommand(userId, request.TimeSlotId, request.BookingDate, request.SelectedServices);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to create booking");

        return CreatedResponse(nameof(GetById), new { id = result.Value }, result.Value!, "Booking created successfully");
    }

    [HttpPost("multi-slot")]
    [ProducesResponseType(typeof(ApiResponse<List<Guid>>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateMultiSlot(
        [FromBody] CreateMultiSlotBookingRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var timeSlots = request.TimeSlots.Select(ts => new BookingSlotRequest(ts.TimeSlotId, ts.BookingDate)).ToList();
        
        var command = new CreateMultiSlotBookingCommand(userId, timeSlots, request.SelectedServices);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Không thể tạo đặt sân");

        return CreatedResponse(
            "GetMultiSlotBookings", 
            new { bookingIds = result.Value }, 
            result.Value!, 
            $"Đã tạo thành công {result.Value!.Count} đặt sân");
    }

    [HttpPost("{id:guid}/cancel")]
    [HttpPatch("{id:guid}/cancel")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Cancel(
        Guid id,
        [FromBody] CancelBookingRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var command = new CancelBookingCommand(id, userId, request.Reason);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to cancel booking");

        return OkResponse<object?>(null, "Booking cancelled successfully");
    }

    [HttpPatch("{id:guid}/confirm")]
    [Authorize(Roles = "PitchOwner,PitchStaff")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Confirm(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var command = new ConfirmBookingCommand(id, userId);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to confirm booking");

        return OkResponse<object?>(null, "Booking confirmed successfully");
    }

    [HttpPost("{id:guid}/services")]
    [Authorize(Roles = "PitchOwner,PitchStaff")]
    public async Task<IActionResult> AddServices(Guid id, [FromBody] List<BookingServiceRequest> services, CancellationToken cancellationToken)
    {
        var requesterId = GetCurrentUserId();
        var booking = await _context.Bookings
            .Include(item => item.TimeSlot)
                .ThenInclude(slot => slot.Pitch)
            .Include(item => item.Services)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (booking?.TimeSlot?.Pitch == null) return NotFoundResponse("Booking not found");
        if (booking.Status != BookingStatus.Confirmed)
            return BadRequestResponse("Only confirmed bookings can receive additional services");

        var ownerId = requesterId;
        if (User.IsInRole("PitchStaff"))
        {
            var staff = await _userRepository.GetByIdAsync(requesterId, cancellationToken);
            if (staff?.OwnerId == null) return BadRequestResponse("Staff account is not linked to an owner");
            ownerId = staff.OwnerId.Value;
        }

        if (booking.TimeSlot.Pitch.OwnerId != ownerId) return Forbid();
        if (services.Count == 0) return BadRequestResponse("Select at least one service");

        var quantities = services.GroupBy(item => item.ServiceId).ToDictionary(group => group.Key, group => group.Sum(item => item.Quantity));
        if (quantities.Values.Any(quantity => quantity <= 0)) return BadRequestResponse("Service quantity must be greater than zero");

        var availableServices = await _context.AdditionalServices
            .Where(service => quantities.Keys.Contains(service.Id)
                && (service.Status == AdditionalServiceStatus.Active || service.Status == AdditionalServiceStatus.PendingApproval)
                && service.SportCenterId == booking.TimeSlot.Pitch.SportCenterId)
            .ToListAsync(cancellationToken);
        if (availableServices.Count != quantities.Count) return BadRequestResponse("Một hoặc nhiều dịch vụ không khả dụng cho sân này.");

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var additionalTotal = 0m;
            var addedBy = await _userRepository.GetByIdAsync(requesterId, cancellationToken);
            foreach (var service in availableServices)
            {
                var quantity = quantities[service.Id];
                service.DecreaseStock(quantity);
                booking.AddIncidentalService(service.Id, service.Name, service.Price, quantity, addedBy?.FullName);
                additionalTotal += service.Price.Amount * quantity;
            }

            var serviceSummary = string.Join(", ", availableServices.Select(service =>
            {
                var quantity = quantities[service.Id];
                return $"{service.Name} x{quantity}";
            }));

            _context.Notifications.Add(Notification.Create(
                booking.UserId,
                NotificationType.SystemAnnouncement,
                "Đơn đặt sân có hóa đơn phát sinh",
                $"Chủ sân vừa thêm dịch vụ vào đơn {booking.CheckInCode ?? booking.Id.ToString("N")[..8].ToUpperInvariant()}: {serviceSummary}. Tổng tiền tăng thêm {additionalTotal:N0}đ."
            ));

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return OkResponse<object?>(null, "Services added successfully");
        }
        catch (Domain.Exceptions.DomainException ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            return BadRequestResponse(ex.Message);
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return BadRequestResponse("Booking was changed by another user. Please reload and try again.");
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            return BadRequestResponse("Không thể cập nhật dịch vụ cho đơn đặt sân.");
        }
    }

    [HttpPatch("{id:guid}/complete")]
    [Authorize(Roles = "PitchOwner,PitchStaff")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Complete(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var command = new CompleteBookingCommand(id, userId);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to complete booking");

        return OkResponse<object?>(null, "Booking completed successfully");
    }

    [HttpGet("my-bookings")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<BookingDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyBookings(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var query = new GetMyBookingsQuery(userId, pageNumber, pageSize, status);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get bookings");

        return OkResponse(result.Value);
    }

    [HttpGet("owner")]
    [Authorize(Roles = "PitchOwner,PitchStaff")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<OwnerBookingDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetOwnerBookings(
        [FromQuery] string? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var ownerId = userId;
        if (User.IsInRole("PitchStaff"))
        {
            var staff = await _userRepository.GetByIdAsync(userId, cancellationToken);
            if (staff?.OwnerId == null)
                return BadRequestResponse("Staff account is not linked to an owner");

            ownerId = staff.OwnerId.Value;
        }

        var query = new GetOwnerBookingsQuery(ownerId, status, pageNumber, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get owner bookings");

        return OkResponse(result.Value);
    }
}
