using Application.Common.DTOs;
using Application.Common.Interfaces;
using Application.Features.Auth.Commands.Register;
using Application.Features.Dashboard.DTOs;
using Application.Features.Dashboard.Queries;
using Api.Contracts;
using Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/v1/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ApiControllerBase
{
    private readonly IMediator _mediator;
    private readonly IUserRepository _userRepository;
    private readonly IApplicationDbContext _context;

    public AdminController(
        IMediator mediator,
        IUserRepository userRepository,
        IApplicationDbContext context)
    {
        _mediator = mediator;
        _userRepository = userRepository;
        _context = context;
    }

    [HttpGet("users")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AdminUserDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] int? role,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAdminUsersQuery(search, role, pageNumber, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get users");

        return OkResponse(result.Value);
    }

    [HttpPost("users")]
    [ProducesResponseType(typeof(ApiResponse<Guid>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateUser(
        [FromBody] AdminCreateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!Enum.IsDefined(typeof(UserRole), request.Role))
            return BadRequestResponse("Invalid role");

        var command = new RegisterCommand(
            request.Email,
            request.Password,
            request.FullName,
            request.PhoneNumber,
            request.Address,
            Role: (UserRole)request.Role
        );

        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess || result.Value == null)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to create user");

        return OkResponse(result.Value.UserId, "User created successfully");
    }

    [HttpDelete("users/{userId:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
            return NotFoundResponse("User not found");

        if (user.Role == UserRole.Admin)
            return BadRequestResponse("Cannot delete admin user");

        await _userRepository.DeleteAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return OkResponse<object?>(null, "User deleted successfully");
    }

    [HttpPatch("users/{userId:guid}/suspend")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SuspendUser(Guid userId, CancellationToken cancellationToken = default)
    {
        var command = new SuspendUserCommand(userId);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to update user status");

        return OkResponse<object?>(null, "User status updated successfully.");
    }

    [HttpGet("pitch-approvals")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PitchApprovalDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPitchApprovals(
        [FromQuery] string status = "pending",
        CancellationToken cancellationToken = default)
    {
        var query = new GetPitchApprovalsQuery(status);
        var result = await _mediator.Send(query, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to get pitch approvals");

        return OkResponse(result.Value);
    }

    [HttpPatch("pitch-approvals/{id:guid}/approve")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ApprovePitch(Guid id, CancellationToken cancellationToken = default)
    {
        var command = new ApprovePitchCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to approve pitch");

        return OkResponse<object?>(null, "Pitch approved successfully.");
    }

    [HttpPatch("pitch-approvals/{id:guid}/reject")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RejectPitch(Guid id, CancellationToken cancellationToken = default)
    {
        var command = new RejectPitchCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
            return BadRequestResponse(result.ErrorMessage ?? "Failed to reject pitch");

        return OkResponse<object?>(null, "Pitch registration rejected.");
    }
}
