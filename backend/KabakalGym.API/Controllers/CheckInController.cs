using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using KabakalGym.API.DTOs.CheckIn;
using KabakalGym.API.Services.Interfaces;
using KabakalGym.API.Models;

namespace KabakalGym.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CheckInController : ControllerBase
{
    private readonly ICheckInService _checkInService;

    public CheckInController(ICheckInService checkInService)
    {
        _checkInService = checkInService;
    }

    /// <summary>
    /// Gets the current rolling 5-minute QR payload.
    /// Only the GateKiosk role can access this.
    /// </summary>
    [HttpGet("qr")]
    [Authorize(Roles = UserRoles.GateKiosk + "," + UserRoles.Admin)]
    public IActionResult GetQrPayload()
    {
        var payload = _checkInService.GenerateQrPayload();
        return Ok(new { payload });
    }

    /// <summary>
    /// Validates the scanned payload and GPS coordinates.
    /// Members scan the kiosk screen.
    /// </summary>
    [HttpPost("verify")]
    [Authorize(Roles = UserRoles.Member)]
    public async Task<IActionResult> VerifyCheckIn([FromBody] CheckInRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var result = await _checkInService.VerifyCheckInAsync(userId, dto.QrPayload, dto.Latitude, dto.Longitude);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.ErrorMessage });

        return Ok(new { message = result.Data });
    }

    /// <summary>
    /// Gets the current live capacity of the gym (number of checked-in users).
    /// </summary>
    [HttpGet("capacity")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLiveCapacity()
    {
        int capacity = await _checkInService.GetCurrentCapacityAsync();
        return Ok(new { capacity });
    }
}
