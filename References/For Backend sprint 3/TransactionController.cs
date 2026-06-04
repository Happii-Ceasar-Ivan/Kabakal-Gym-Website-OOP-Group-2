using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KabakalGym.API.DTOs.Common;
using KabakalGym.API.DTOs.Transaction;
using KabakalGym.API.Helpers;
using KabakalGym.API.Models;
using KabakalGym.API.Services.Interfaces;

namespace KabakalGym.API.Controllers;

/// <summary>
/// TransactionController
/// Financial ledger read access and admin payment recording.
///
/// Routes:
///   GET  /api/transaction/me           [Authorize]        Member views own history (paged)
///   GET  /api/transaction/{userId}     [Authorize(Admin)] Admin views any member's history
///   POST /api/transaction              [Authorize(Admin)] Record payment + update subscription
///
/// The Transaction table is an append-only ledger — no PATCH or DELETE endpoints
/// exist. Corrections are handled by recording a compensating transaction.
///
/// IDOR PROTECTION: /me reads UserId from the JWT — no userId route parameter.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public TransactionController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    // ──────────────────────────────────────────────────────────────────────
    // GET /api/transaction/me  —  Member: own payment history
    // ──────────────────────────────────────────────────────────────────────

    /// <summary>Returns the authenticated member's paginated transaction history.</summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(PagedResultDto<TransactionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyTransactions(
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 10)
    {
        var userId = this.User.GetUserId();
        var result = await _transactionService.GetUserTransactionsAsync(userId, page, pageSize);

        return result.IsSuccess
            ? Ok(result.Data)
            : NotFound(new { error = result.ErrorMessage });
    }

    // ──────────────────────────────────────────────────────────────────────
    // GET /api/transaction/{userId}  —  Admin: view any member's history
    // NOTE: Declared after /me to prevent routing ambiguity
    // ──────────────────────────────────────────────────────────────────────

    /// <summary>Returns a specific member's paginated transaction history. Admin-only.</summary>
    [HttpGet("{userId:guid}")]
    [Authorize(Roles = UserRoles.Admin)]
    [ProducesResponseType(typeof(PagedResultDto<TransactionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserTransactions(
        Guid userId,
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _transactionService.GetUserTransactionsAsync(userId, page, pageSize);

        return result.IsSuccess
            ? Ok(result.Data)
            : NotFound(new { error = result.ErrorMessage });
    }

    // ──────────────────────────────────────────────────────────────────────
    // POST /api/transaction  —  Admin: record a payment
    // ──────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Records a payment and updates the member's subscription in one atomic write.
    /// PlanType (Day | Monthly | Annual) determines how many days to extend ExpirationDate.
    /// If the member's subscription is still active, days are stacked on top.
    /// Admin-only.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    [ProducesResponseType(typeof(TransactionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object),          StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecordPayment([FromBody] RecordTransactionDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _transactionService.RecordPaymentAsync(dto);

        if (!result.IsSuccess)
        {
            // "Member not found" → 404; "Deactivated account" → 400
            return result.ErrorMessage!.Contains("not found")
                ? NotFound(new { error = result.ErrorMessage })
                : BadRequest(new { error = result.ErrorMessage });
        }

        return StatusCode(StatusCodes.Status201Created, result.Data);
    }
}
