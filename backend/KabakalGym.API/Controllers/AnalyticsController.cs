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

    [HttpGet("historical-revenue")]
    public async Task<ActionResult<List<HistoricalRevenueDto>>> GetHistoricalRevenue([FromQuery] int months = 6)
    {
        if (months <= 0 || months > 24)
        {
            return BadRequest(new { Message = "Months must be between 1 and 24." });
        }

        var result = await _analyticsService.GetHistoricalRevenueAsync(months);
        return Ok(result);
    }

    [HttpDelete("export-archive")]
    public async Task<IActionResult> ExportAndArchive([FromQuery] int monthsAgo = 3)
    {
        if (monthsAgo < 1)
        {
            return BadRequest(new { Message = "Must archive data at least 1 month old." });
        }

        var csvData = await _analyticsService.ExportAndArchiveOldDataAsync(monthsAgo);
        var bytes = System.Text.Encoding.UTF8.GetBytes(csvData);
        var fileName = $"Kabakal_Archive_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
        
        return File(bytes, "text/csv", fileName);
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportData([FromQuery] int monthsAgo = 3)
    {
        if (monthsAgo < 1)
        {
            return BadRequest(new { Message = "Must export data at least 1 month old." });
        }

        var csvData = await _analyticsService.ExportDataAsync(monthsAgo);
        var bytes = System.Text.Encoding.UTF8.GetBytes(csvData);
        var fileName = $"Kabakal_Export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
        
        return File(bytes, "text/csv", fileName);
    }
}
