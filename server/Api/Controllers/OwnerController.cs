using Api.Contracts;
using Application.Common.DTOs;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DomainUser = Domain.Entities.User;

namespace Api.Controllers;

[Route("api/v1/owner")]
[Authorize(Roles = "PitchOwner")]
public class OwnerController : ApiControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IApplicationDbContext _context;

    public OwnerController(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IApplicationDbContext context)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _context = context;
    }

    [HttpGet("staff")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<object>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStaff(CancellationToken cancellationToken)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty)
            return Unauthorized();

        var staff = await _context.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRole.PitchStaff && u.OwnerId == ownerId)
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.PhoneNumber,
                CreatedAt = u.CreatedAt.ToString("o"),
                u.IsActive
            })
            .ToListAsync(cancellationToken);

        return OkResponse(staff);
    }

    [HttpPost("staff")]
    [ProducesResponseType(typeof(ApiResponse<Guid>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateStaff(
        [FromBody] OwnerCreateStaffRequest request,
        CancellationToken cancellationToken)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty)
            return Unauthorized();

        var emailExists = await _userRepository.EmailExistsAsync(request.Email, cancellationToken);
        if (emailExists)
            return BadRequestResponse("Email already exists");

        var passwordHash = _passwordHasher.HashPassword(request.Password);
        var staff = DomainUser.Create(
            request.Email,
            request.FullName,
            request.PhoneNumber,
            null,
            passwordHash,
            UserRole.PitchStaff
        );
        staff.AssignOwner(ownerId);

        await _userRepository.AddAsync(staff, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return OkResponse(staff.Id, "Staff created successfully");
    }

    [HttpPatch("staff/{id:guid}/toggle-status")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleStaffStatus(
        Guid id,
        CancellationToken cancellationToken)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty)
            return Unauthorized();

        var staff = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.PitchStaff && u.OwnerId == ownerId, cancellationToken);

        if (staff == null)
            return NotFoundResponse("Staff not found");

        if (staff.IsActive) staff.Deactivate();
        else staff.Activate();

        await _userRepository.UpdateAsync(staff, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return OkResponse<object?>(null, "Staff status updated successfully");
    }

    [HttpDelete("staff/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStaff(
        Guid id,
        CancellationToken cancellationToken)
    {
        var ownerId = GetCurrentUserId();
        if (ownerId == Guid.Empty)
            return Unauthorized();

        var staff = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.PitchStaff && u.OwnerId == ownerId, cancellationToken);

        if (staff == null)
            return NotFoundResponse("Staff not found");

        await _userRepository.DeleteAsync(staff, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return OkResponse<object?>(null, "Staff deleted successfully");
    }
}
