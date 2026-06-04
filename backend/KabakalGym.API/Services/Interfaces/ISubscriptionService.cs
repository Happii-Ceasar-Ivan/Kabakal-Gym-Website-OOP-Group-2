using KabakalGym.API.Common;
using KabakalGym.API.DTOs.Common;
using KabakalGym.API.DTOs.Subscription;
using KabakalGym.API.DTOs.User;

namespace KabakalGym.API.Services.Interfaces;

/// <summary>
/// ISubscriptionService
/// Manages membership status reads and admin overrides.
///
/// Payment recording (which also updates the subscription) is handled by
/// ITransactionService.RecordPaymentAsync() to keep the financial ledger
/// and the subscription update in a single atomic operation.
/// </summary>
public interface ISubscriptionService
{
    /// <summary>
    /// Returns the subscription status for a given userId.
    /// Used by GET /api/subscription/me (member) and GET /api/subscription/{id} (admin).
    /// Fail: user not found.
    /// </summary>
    Task<ServiceResult<SubscriptionStatusDto>> GetSubscriptionStatusAsync(Guid userId);

    /// <summary>
    /// Returns a paginated list of all Member-role accounts with embedded subscription state.
    /// Admin-only. Optional email/name search filter.
    /// </summary>
    Task<ServiceResult<PagedResultDto<MemberProfileDto>>> GetAllMembersAsync(
        int     page,
        int     pageSize,
        string? search = null
    );

    /// <summary>
    /// Manually overrides a member's payment status and/or expiry date.
    /// Admin-only. Used for corrections, not for recording actual payments
    /// (use ITransactionService.RecordPaymentAsync for that).
    /// Fail: user not found.
    /// </summary>
    Task<ServiceResult<SubscriptionStatusDto>> UpdateSubscriptionAsync(
        Guid                  userId,
        UpdateSubscriptionDto dto
    );
}
