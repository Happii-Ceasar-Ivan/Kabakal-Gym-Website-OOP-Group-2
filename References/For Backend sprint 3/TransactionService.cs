using Microsoft.EntityFrameworkCore;
using KabakalGym.API.Common;
using KabakalGym.API.Data;
using KabakalGym.API.DTOs.Common;
using KabakalGym.API.DTOs.Transaction;
using KabakalGym.API.Models;
using KabakalGym.API.Services.Interfaces;

namespace KabakalGym.API.Services;

/// <summary>
/// TransactionService
/// Handles payment recording and transaction history queries.
///
/// ATOMICITY: RecordPaymentAsync() writes BOTH the Transaction row AND the
/// Subscription update in a single SaveChangesAsync() call. If either write
/// fails, neither is committed — the ledger and subscription state stay in sync.
///
/// STACKING: If a member's current ExpirationDate is in the future, the new
/// plan period is added on top (not replaced from today). This prevents
/// admins from accidentally zeroing out a member's remaining days.
///
/// IMMUTABILITY: Transaction rows are INSERT-only. No update or delete
/// operations are exposed. Financial records must be corrected by issuing
/// a compensating transaction, not by editing existing records.
/// </summary>
public sealed class TransactionService : ITransactionService
{
    private readonly KabakalDbContext _context;

    public TransactionService(KabakalDbContext context)
    {
        _context = context;
    }

    // ──────────────────────────────────────────────────────────────────────
    // GET USER TRANSACTION HISTORY
    // ──────────────────────────────────────────────────────────────────────

    public async Task<ServiceResult<PagedResultDto<TransactionDto>>> GetUserTransactionsAsync(
        Guid userId,
        int  page,
        int  pageSize)
    {
        page     = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        // Guard: confirm user exists (prevents exposing empty results for arbitrary GUIDs)
        var userExists = await _context.Users
            .AsNoTracking()
            .AnyAsync(u => u.UserId == userId);

        if (!userExists)
            return ServiceResult<PagedResultDto<TransactionDto>>.Fail("Member not found.");

        var query = _context.Transactions
            .AsNoTracking()
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.Timestamp); // Newest first — uses IX_Transactions_UserId_Timestamp

        var totalCount = await query.CountAsync();

        if (totalCount == 0)
            return ServiceResult<PagedResultDto<TransactionDto>>.Success(
                PagedResultDto<TransactionDto>.Empty(page, pageSize)
            );

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TransactionDto(
                t.TransactionId,
                t.UserId,
                t.AmountPaid,
                t.PaymentMethod,
                t.Timestamp
            ))
            .ToListAsync();

        return ServiceResult<PagedResultDto<TransactionDto>>.Success(
            PagedResultDto<TransactionDto>.Create(items, totalCount, page, pageSize)
        );
    }

    // ──────────────────────────────────────────────────────────────────────
    // RECORD PAYMENT (ADMIN)
    // ──────────────────────────────────────────────────────────────────────

    public async Task<ServiceResult<TransactionDto>> RecordPaymentAsync(RecordTransactionDto dto)
    {
        // 1. Validate PlanType (already validated by [RegularExpression] on DTO,
        //    but double-check here as a service-layer defense-in-depth guard)
        if (!PlanTypes.IsValid(dto.PlanType))
            return ServiceResult<TransactionDto>.Fail(
                $"Invalid PlanType '{dto.PlanType}'. Must be: Day, Monthly, or Annual."
            );

        // 2. Load the target user + their subscription (tracked — we will UPDATE subscription)
        var user = await _context.Users
            .Include(u => u.Subscription)
            .FirstOrDefaultAsync(u => u.UserId == dto.UserId);

        if (user is null)
            return ServiceResult<TransactionDto>.Fail("Target member not found.");

        if (!user.IsActive)
            return ServiceResult<TransactionDto>.Fail(
                "Cannot record a payment for a deactivated account."
            );

        // 3. Build the immutable Transaction ledger entry
        var transaction = new Transaction
        {
            TransactionId = Guid.NewGuid(),
            UserId        = dto.UserId,
            AmountPaid    = dto.AmountPaid,
            PaymentMethod = dto.PaymentMethod,
            Timestamp     = DateTime.UtcNow,
        };

        // 4. Compute new ExpirationDate with stacking logic
        int daysToAdd      = PlanTypes.GetDays(dto.PlanType);
        var baseDate       = DateTime.UtcNow;
        var currentExpiry  = user.Subscription?.ExpirationDate;

        // STACKING: If the member's current subscription hasn't expired yet,
        // add the new period ON TOP of their existing expiry date.
        // This prevents admins from accidentally removing remaining days.
        if (currentExpiry.HasValue && currentExpiry.Value > DateTime.UtcNow)
            baseDate = currentExpiry.Value;

        var newExpiration = baseDate.AddDays(daysToAdd);

        // 5. Update or create the Subscription row
        if (user.Subscription is null)
        {
            // Edge case: user registered before the auto-bootstrap was in place
            var newSubscription = new Subscription
            {
                UserId         = dto.UserId,
                PaymentStatus  = PaymentStatuses.Paid,
                ExpirationDate = newExpiration,
            };
            _context.Subscriptions.Add(newSubscription);
        }
        else
        {
            user.Subscription.PaymentStatus  = PaymentStatuses.Paid;
            user.Subscription.ExpirationDate = newExpiration;
        }

        // 6. Atomic write — both Transaction INSERT and Subscription UPDATE
        //    committed in a single round-trip. If either fails, EF rolls back both.
        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        var responseDto = new TransactionDto(
            transaction.TransactionId,
            transaction.UserId,
            transaction.AmountPaid,
            transaction.PaymentMethod,
            transaction.Timestamp
        );

        return ServiceResult<TransactionDto>.Success(responseDto);
    }
}
