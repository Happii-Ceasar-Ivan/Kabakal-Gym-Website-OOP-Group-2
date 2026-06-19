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
    /// Updates the user's profile settings (Bio, Profile Picture, Background Picture)
    /// </summary>
    [HttpPatch("settings")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfileSettings([FromBody] UpdateProfileSettingsDto dto)
    {
        var userId = User.GetUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return NotFound(new { error = "User not found." });

        if (!string.IsNullOrWhiteSpace(dto.ProfilePictureUrl))
        {
            if (!dto.ProfilePictureUrl.StartsWith("https://res.cloudinary.com/", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { error = "Invalid profile image URL." });
            user.ProfilePictureUrl = dto.ProfilePictureUrl;
        }

        if (!string.IsNullOrWhiteSpace(dto.BackgroundPictureUrl))
        {
            if (!dto.BackgroundPictureUrl.StartsWith("https://res.cloudinary.com/", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { error = "Invalid background image URL." });
            user.BackgroundPictureUrl = dto.BackgroundPictureUrl;
        }

        if (dto.Bio != null)
        {
            user.Bio = dto.Bio.Trim();
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Profile settings updated successfully." });
    }

    /// <summary>
    /// Export user data as JSON
    /// </summary>
    [HttpGet("export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportAccountData()
    {
        var userId = User.GetUserId();
        var user = await _context.Users
            .Include(u => u.Transactions)
            .Include(u => u.Routines)
            .Include(u => u.Visits)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null) return NotFound(new { error = "User not found." });

        var exportData = new
        {
            Profile = new { user.FirstName, user.LastName, user.Email, user.Bio, user.Role },
            Transactions = user.Transactions.Select(t => new { t.AmountPaid, t.PaymentMethod, t.Status, t.Timestamp }),
            Routines = user.Routines.Select(r => new { r.DayLabel, r.FocusArea, r.IsRestDay, r.DateAssigned, r.CompletedAt }),
            Visits = user.Visits.Select(v => new { v.CheckIn, v.IsApproved })
        };

        return Ok(exportData);
    }

    /// <summary>
    /// Hybrid Account Deletion (Deactivate or Permanent)
    /// </summary>
    [HttpDelete("account")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteAccount([FromQuery] bool permanent = false)
    {
        var userId = User.GetUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound(new { error = "User not found." });

        user.IsActive = false; // Soft delete

        if (permanent)
        {
            // Scramble identifying info completely
            user.Email = $"deleted_{Guid.NewGuid()}@kabakalgym.com";
            user.FirstName = "Deleted";
            user.LastName = "User";
            user.Bio = null;
            user.ProfilePictureUrl = null;
            user.BackgroundPictureUrl = null;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = permanent ? "Account permanently deleted." : "Account deactivated." });
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

    /// <summary>
    /// Gets gate log (visits) and assigned workout routine for a specific date.
    /// </summary>
    [HttpGet("calendar/{date}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCalendarData(string date)
    {
        var userId = User.GetUserId();

        if (!DateOnly.TryParse(date, out var targetDate))
            return BadRequest(new { error = "Invalid date format. Use YYYY-MM-DD." });

        // 1. Fetch Visits
        var targetDateTime = targetDate.ToDateTime(TimeOnly.MinValue);
        var nextDayDateTime = targetDate.AddDays(1).ToDateTime(TimeOnly.MinValue);

        var visits = await _context.Visits
            .AsNoTracking()
            .Where(v => v.UserId == userId && v.CheckIn >= targetDateTime && v.CheckIn < nextDayDateTime)
            .OrderByDescending(v => v.CheckIn)
            .Select(v => new 
            {
                v.VisitId,
                v.CheckIn,
                v.CheckOut,
                v.IsApproved
            })
            .ToListAsync();

        // 2. Fetch Routine for that date
        var routine = await _context.Routines
            .AsNoTracking()
            .Include(r => r.RoutineLists)
                .ThenInclude(rl => rl.Exercise)
            .Where(r => r.UserId == userId && r.DateAssigned == targetDate)
            .Select(r => new
            {
                r.RoutineId,
                r.DayLabel,
                r.FocusArea,
                r.IsRestDay,
                r.IsCompleted,
                Exercises = r.RoutineLists.OrderBy(rl => rl.OrderIndex).Select(rl => new 
                {
                    rl.Exercise.ExerciseName,
                    rl.Sets,
                    rl.Reps,
                    rl.StartingWeight
                }).ToList()
            })
            .FirstOrDefaultAsync();

        return Ok(new
        {
            date = targetDate.ToString("yyyy-MM-dd"),
            visits,
            routine
        });
    }
}

public class UpdateProfilePictureDto
{
    public string ProfilePictureUrl { get; set; } = string.Empty;
}
