using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KabakalGym.API.DTOs.Common;
using KabakalGym.API.DTOs.Subscription;
using KabakalGym.API.DTOs.User;
using KabakalGym.API.Helpers;
using KabakalGym.API.Models;
using KabakalGym.API.Services.Interfaces;

namespace KabakalGym.API.Controllers;

/// <summary>
/// SubscriptionController
/// Membership status and admin management endpoints.
///
/// Routes:
///   GET  /api/subscription/me              [Authorize]        Member views own status
///   GET  /api/subscription/{userId}        [Authorize(Admin)] Admin views any member
///   PATCH /api/subscription/{userId}       [Authorize(Admin)] Admin overrides status/expiry
///   GET  /api/subscription/members        [Authorize(Admin)] Paginated member list
///
/// IDOR PROTECTION:
///   /me endpoints extract UserId from the JWT via GetUserId() — never from
///   a query or body parameter. A member cannot access another member's data
///   by guessing or substituting a userId.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubscriptionController : ControllerBase
{
    private readonly ISubscriptionService _subscriptionService;

    public SubscriptionController(ISubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    // ──────────────────────────────────────────────────────────────────────
    // GET /api/subscription/me  —  Member self-service
    // ──────────────────────────────────────────────────────────────────────

    /// <summary>Returns the authenticated member's current subscription status.</summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(SubscriptionStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMySubscription()
    {
        var userId = this.User.GetUserId();
        var result = await _subscriptionService.GetSubscriptionStatusAsync(userId);

        return result.IsSuccess
            ? Ok(result.Data)
            : NotFound(new { error = result.ErrorMessage });
    }

    // ──────────────────────────────────────────────────────────────────────
    // GET /api/subscription/members  —  Admin: paginated member list
    // NOTE: This route must be declared BEFORE /{userId} to prevent ASP.NET
    // routing from treating "members" as a Guid and returning 400.
    // ──────────────────────────────────────────────────────────────────────

    /// <summary>Returns a paginated list of all members with subscription state.</summary>
    [HttpGet("members")]
    [Authorize(Roles = UserRoles.Admin)]
    [ProducesResponseType(typeof(PagedResultDto<MemberProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllMembers(
        [FromQuery] int     page     = 1,
        [FromQuery] int     pageSize = 20,
        [FromQuery] string? search   = null)
    {
        var result = await _subscriptionService.GetAllMembersAsync(page, pageSize, search);
        return Ok(result.Data); // Always succeeds — returns empty page on no results
    }

    // ──────────────────────────────────────────────────────────────────────
    // GET /api/subscription/{userId}  —  Admin: view any member's status
    // ──────────────────────────────────────────────────────────────────────

    /// <summary>Returns a specific member's subscription status. Admin-only.</summary>
    [HttpGet("{userId:guid}")]
    [Authorize(Roles = UserRoles.Admin)]
    [ProducesResponseType(typeof(SubscriptionStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSubscription(Guid userId)
    {
        var result = await _subscriptionService.GetSubscriptionStatusAsync(userId);

        return result.IsSuccess
            ? Ok(result.Data)
            : NotFound(new { error = result.ErrorMessage });
    }

    // ──────────────────────────────────────────────────────────────────────
    // PATCH /api/subscription/{userId}  —  Admin: manual override
    // ──────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Manually overrides a member's payment status and/or expiry date.
    /// Admin-only. For recording actual payments, use POST /api/transaction instead.
    /// </summary>
    [HttpPatch("{userId:guid}")]
    [Authorize(Roles = UserRoles.Admin)]
    [ProducesResponseType(typeof(SubscriptionStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object),                StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSubscription(
        Guid                  userId,
        [FromBody] UpdateSubscriptionDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _subscriptionService.UpdateSubscriptionAsync(userId, dto);

        return result.IsSuccess
            ? Ok(result.Data)
            : NotFound(new { error = result.ErrorMessage });
    }
}
