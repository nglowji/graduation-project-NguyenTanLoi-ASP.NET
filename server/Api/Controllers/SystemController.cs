using Application.Common.DTOs;
using Application.Common.Interfaces;
using Api.Contracts;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/v1/system")]
[AllowAnonymous]
public class SystemController : ApiControllerBase
{
    private readonly ISystemSettingService _settingService;

    public SystemController(ISystemSettingService settingService)
    {
        _settingService = settingService;
    }

    [HttpGet("checkout")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCheckoutSettings(CancellationToken cancellationToken = default)
    {
        var bookingHoldMinutes = await _settingService.GetIntAsync(
            SystemConfiguration.Keys.BookingLockDurationMinutes,
            10,
            1,
            60,
            cancellationToken);

        var depositPercentage = await _settingService.GetDecimalAsync(
            SystemConfiguration.Keys.DepositPercentage,
            10m,
            0m,
            100m,
            cancellationToken);

        return OkResponse(new
        {
            bookingHoldMinutes,
            depositPercentage
        });
    }
}
