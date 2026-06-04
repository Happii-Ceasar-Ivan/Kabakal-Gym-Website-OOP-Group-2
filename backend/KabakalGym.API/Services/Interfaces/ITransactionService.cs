using KabakalGym.API.Common;
using KabakalGym.API.DTOs.Common;
using KabakalGym.API.DTOs.Transaction;

namespace KabakalGym.API.Services.Interfaces;

/// <summary>
/// ITransactionService
/// Handles financial ledger operations.
///
/// RecordPaymentAsync() is the primary payment workflow:
///   → Creates an immutable Transaction row (the ledger entry)
///   → Updates the member's Subscription (PaymentStatus + ExpirationDate)
///   Both writes occur in a single SaveChangesAsync() — atomically.
/// </summary>
public interface ITransactionService
{
    /// <summary>
    /// Returns paginated transaction history for the given userId.
    /// Ordered by Timestamp descending (newest first).
    /// Used by GET /api/transaction/me (member self-service)
    ///      and GET /api/transaction/{userId} (admin view).
    /// Fail: user not found.
    /// </summary>
    Task<ServiceResult<PagedResultDto<TransactionDto>>> GetUserTransactionsAsync(
        Guid userId,
        int  page,
        int  pageSize
    );

    /// <summary>
    /// Records a payment and updates the member's subscription in one atomic write.
    /// Admin-only. PlanType (Day|Monthly|Annual) determines the ExpirationDate offset.
    ///
    /// Stacking rule: if the member already has an unexpired subscription,
    /// the new period is added on top of the existing ExpirationDate.
    ///
    /// Fail cases: target user not found | target user is deactivated.
    /// </summary>
    Task<ServiceResult<TransactionDto>> RecordPaymentAsync(RecordTransactionDto dto);
}
