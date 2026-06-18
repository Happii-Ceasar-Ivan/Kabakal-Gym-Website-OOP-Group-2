using KabakalGym.API.DTOs.Analytics;
using KabakalGym.API.Services.Interfaces;
using KabakalGym.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KabakalGym.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = UserRoles.Admin)] // Secure endpoint for Admins only
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<BusinessAnalyticsResponseDto>> GetDashboard([FromQuery] int year, [FromQuery] int month)
    {
        if (year <= 2000 || month < 1 || month > 12)
        {
            return BadRequest(new { Message = "Invalid year or month provided." });
        }

        var result = await _analyticsService.GetDashboardAnalyticsAsync(year, month);
        return Ok(result);
    }
}
