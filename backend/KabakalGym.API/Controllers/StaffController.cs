using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using KabakalGym.API.Data;
using KabakalGym.API.Models;
using System.Security.Claims;

namespace KabakalGym.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = UserRoles.Staff + "," + UserRoles.Admin)]
public class StaffController : ControllerBase
{
    private readonly KabakalDbContext _context;
    private readonly IMemoryCache _cache;

    public StaffController(KabakalDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    /// <summary>
    /// Gets all unapproved (pending payment) walk-in visits for today.
    /// Polled by the Staff Dashboard.
    /// </summary>
    [HttpGet("pending-checkins")]
    public async Task<IActionResult> GetPendingCheckins()
    {
        var today = DateTime.UtcNow.Date;
        
        var pendingVisits = await _context.Visits
            .Include(v => v.User)
            .Where(v => !v.IsApproved && v.CheckIn >= today)
            .OrderByDescending(v => v.CheckIn)
            .Select(v => new
            {
                VisitId = v.VisitId,
                UserId = v.UserId,
                FullName = $"{v.User.FirstName} {v.User.LastName}",
                Email = v.User.Email,
                CheckInTime = v.CheckIn
            })
            .ToListAsync();

        return Ok(pendingVisits);
    }

    /// <summary>
    /// Approves a pending walk-in visit and records a ₱50 Cash transaction.
    /// </summary>
    [HttpPost("approve-checkin/{visitId}")]
    public async Task<IActionResult> ApproveCheckIn(Guid visitId)
    {
        var visit = await _context.Visits
            .Include(v => v.User)
            .FirstOrDefaultAsync(v => v.VisitId == visitId);

        if (visit == null)
            return NotFound(new { error = "Visit not found." });

        if (visit.IsApproved)
            return BadRequest(new { error = "Visit is already approved." });

        // 1. Approve the visit
        visit.IsApproved = true;
        _context.Visits.Update(visit);

        // 2. Record the ₱50 Day Pass transaction
        var transaction = new Transaction
        {
            UserId = visit.UserId,
            AmountPaid = 50.00m,
            PaymentMethod = "Cash",
            Timestamp = DateTime.UtcNow
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        // Invalidate capacity cache so the live counter updates
        _cache.Remove("LiveCapacity");

        return Ok(new { message = $"Successfully approved check-in for {visit.User.FirstName} {visit.User.LastName} and recorded ₱50 cash payment." });
    }
}
