using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KabakalGym.API.DTOs.User;
using KabakalGym.API.Helpers;
using KabakalGym.API.Services.Interfaces;
using KabakalGym.API.Models;
using Microsoft.EntityFrameworkCore;
using KabakalGym.API.Data;

namespace KabakalGym.API.Controllers;

[ApiController]
[Route("api/me")]
[Authorize]
public class MeController : ControllerBase
{
    private readonly IMemberManagementService _memberService;
    private readonly KabakalDbContext _context;

    public MeController(IMemberManagementService memberService, KabakalDbContext context)
    {
        _memberService = memberService;
        _context = context;
    }

    /// <summary>
    /// Gets the current logged-in user's profile.
    /// Accessible by any authenticated user (Member, Admin, Staff).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(MemberProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = User.GetUserId();
        var result = await _memberService.GetMemberAsync(userId);
        
        if (!result.IsSuccess)
            return NotFound(new { error = result.ErrorMessage });

        return Ok(result.Data);
    }

    /// <summary>
    /// Securely updates the user's profile picture URL after a Cloudinary upload.
    /// </summary>
    [HttpPatch("profile-picture")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfilePicture([FromBody] UpdateProfilePictureDto dto)
    {
        var userId = User.GetUserId();

        // Security check: MUST be a valid Cloudinary URL
        if (string.IsNullOrWhiteSpace(dto.ProfilePictureUrl) || 
            !dto.ProfilePictureUrl.StartsWith("https://res.cloudinary.com/", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "Invalid image URL. Only secure Cloudinary URLs are accepted." });
        }

        // Validate URL length to prevent buffer bloat
        if (dto.ProfilePictureUrl.Length > 500)
        {
            return BadRequest(new { error = "Image URL is too long." });
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return NotFound(new { error = "User not found." });

        user.ProfilePictureUrl = dto.ProfilePictureUrl;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Profile picture updated successfully." });
    }

    /// <summary>
    /// Computes the user's weekly attendance and current week-streak based on their CheckIn history.
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyStats()
    {
        var userId = User.GetUserId();
        
        var visits = await _context.Visits
            .Where(v => v.UserId == userId && v.IsApproved)
            .OrderByDescending(v => v.CheckIn)
            .Select(v => v.CheckIn)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var diff = (7 + (now.DayOfWeek - DayOfWeek.Monday)) % 7;
        var startOfThisWeek = now.AddDays(-1 * diff).Date;

        int attendedThisWeek = visits.Count(v => v >= startOfThisWeek);

        var activeWeeks = visits
            .Select(v => 
            {
                var d = (7 + (v.DayOfWeek - DayOfWeek.Monday)) % 7;
                return v.AddDays(-1 * d).Date;
            })
            .Distinct()
            .OrderByDescending(d => d)
            .ToList();

        int streak = 0;
        var checkWeek = startOfThisWeek;

        if (activeWeeks.Contains(checkWeek))
        {
            foreach (var week in activeWeeks)
            {
                if (week == checkWeek)
                {
                    streak++;
                    checkWeek = checkWeek.AddDays(-7);
                }
                else break;
            }
        }
        else if (activeWeeks.Contains(checkWeek.AddDays(-7)))
        {
            checkWeek = checkWeek.AddDays(-7);
            foreach (var week in activeWeeks)
            {
                if (week == checkWeek)
                {
                    streak++;
                    checkWeek = checkWeek.AddDays(-7);
                }
                else break;
            }
        }

        return Ok(new 
        {
            attendedThisWeek,
            weekStreak = streak
        });
    }

    /// <summary>
    /// Gets the most recently saved routine for the current user.
    /// </summary>
    [HttpGet("latest-routine")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLatestRoutine()
    {
        var userId = User.GetUserId();
        
        var routine = await _context.Routines
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.DateAssigned)
            .Select(r => new { r.RoutineId, r.DayLabel, r.FocusArea })
            .FirstOrDefaultAsync();

        if (routine == null)
        {
            return Ok(new { hasRoutine = false });
        }

        return Ok(new { hasRoutine = true, routine });
    }
}

public class UpdateProfilePictureDto
{
    public string ProfilePictureUrl { get; set; } = string.Empty;
}
