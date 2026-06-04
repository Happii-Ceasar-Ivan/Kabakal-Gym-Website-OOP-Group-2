using Microsoft.EntityFrameworkCore;
using KabakalGym.API.Common;
using KabakalGym.API.Data;
using KabakalGym.API.DTOs.Common;
using KabakalGym.API.DTOs.Subscription;
using KabakalGym.API.DTOs.User;
using KabakalGym.API.Models;
using KabakalGym.API.Services.Interfaces;

namespace KabakalGym.API.Services;

/// <summary>
/// SubscriptionService
/// Handles membership status reads and admin manual overrides.
///
/// QUERY STRATEGY:
/// All list queries use .Select() projection directly into DTOs — EF Core
/// translates the projection to SQL-level column selection, avoiding loading
/// full entity graphs into memory. No .Include() on list queries.
///
/// Single-record queries use .FirstOrDefaultAsync() with .AsNoTracking()
/// for reads. Admin override (PATCH) re-queries with tracking to issue an UPDATE.
/// </summary>
public sealed class SubscriptionService : ISubscriptionService
{
    private readonly KabakalDbContext _context;

    public SubscriptionService(KabakalDbContext context)
    {
        _context = context;
    }

    // ──────────────────────────────────────────────────────────────────────
    // GET SUBSCRIPTION STATUS
    // ──────────────────────────────────────────────────────────────────────

    public async Task<ServiceResult<SubscriptionStatusDto>> GetSubscriptionStatusAsync(Guid userId)
    {
        var dto = await _context.Users
            .AsNoTracking()
            .Where(u => u.UserId == userId)
            .Select(u => new SubscriptionStatusDto(
                u.UserId,
                u.Email,
                u.FirstName,
                u.LastName,
                u.Subscription != null ? u.Subscription.PaymentStatus : PaymentStatuses.Unpaid,
                u.Subscription != null ? u.Subscription.ExpirationDate : null,
                // IsExpired: true if no subscription, unpaid, or past expiry date
                u.Subscription == null
                    || u.Subscription.PaymentStatus != PaymentStatuses.Paid
                    || (u.Subscription.ExpirationDate.HasValue
                        && u.Subscription.ExpirationDate.Value < DateTime.UtcNow),
                u.IsActive
            ))
            .FirstOrDefaultAsync();

        return dto is null
            ? ServiceResult<SubscriptionStatusDto>.Fail("Member not found.")
            : ServiceResult<SubscriptionStatusDto>.Success(dto);
    }

    // ──────────────────────────────────────────────────────────────────────
    // GET ALL MEMBERS (ADMIN)
    // ──────────────────────────────────────────────────────────────────────

    public async Task<ServiceResult<PagedResultDto<MemberProfileDto>>> GetAllMembersAsync(
        int     page,
        int     pageSize,
        string? search = null)
    {
        // Clamp page size — client request is a suggestion, server enforces the cap
        page     = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _context.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRoles.Member);

        // Optional search: email prefix, first name, or last name (case-insensitive)
        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.ToLower().Trim();
            query = query.Where(u =>
                u.Email.ToLower().Contains(normalized)     ||
                u.FirstName.ToLower().Contains(normalized) ||
                u.LastName.ToLower().Contains(normalized)
            );
        }

        var totalCount = await query.CountAsync();

        if (totalCount == 0)
            return ServiceResult<PagedResultDto<MemberProfileDto>>.Success(
                PagedResultDto<MemberProfileDto>.Empty(page, pageSize)
            );

        var items = await query
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new MemberProfileDto(
                u.UserId,
                u.Email,
                u.FirstName,
                u.LastName,
                u.Role,
                u.IsActive,
                u.Subscription != null ? u.Subscription.PaymentStatus : null,
                u.Subscription != null ? u.Subscription.ExpirationDate : null,
                u.Subscription == null
                    || u.Subscription.PaymentStatus != PaymentStatuses.Paid
                    || (u.Subscription.ExpirationDate.HasValue
                        && u.Subscription.ExpirationDate.Value < DateTime.UtcNow)
            ))
            .ToListAsync();

        return ServiceResult<PagedResultDto<MemberProfileDto>>.Success(
            PagedResultDto<MemberProfileDto>.Create(items, totalCount, page, pageSize)
        );
    }

    // ──────────────────────────────────────────────────────────────────────
    // UPDATE SUBSCRIPTION (ADMIN MANUAL OVERRIDE)
    // ──────────────────────────────────────────────────────────────────────

    public async Task<ServiceResult<SubscriptionStatusDto>> UpdateSubscriptionAsync(
        Guid                  userId,
        UpdateSubscriptionDto dto)
    {
        // Validate future date if provided
        if (dto.ExpirationDate.HasValue && dto.ExpirationDate.Value <= DateTime.UtcNow)
            return ServiceResult<SubscriptionStatusDto>.Fail(
                "ExpirationDate must be a future UTC datetime."
            );

        // Re-query with tracking so EF can issue an UPDATE
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (subscription is null)
        {
            // Guard: check that the user actually exists
            var userExists = await _context.Users.AnyAsync(u => u.UserId == userId);
            if (!userExists)
                return ServiceResult<SubscriptionStatusDto>.Fail("Member not found.");

            // User exists but has no subscription row — create one
            subscription = new Subscription
            {
                UserId        = userId,
                PaymentStatus = dto.PaymentStatus,
                ExpirationDate = dto.ExpirationDate,
            };
            _context.Subscriptions.Add(subscription);
        }
        else
        {
            subscription.PaymentStatus = dto.PaymentStatus;
            if (dto.ExpirationDate.HasValue)
                subscription.ExpirationDate = dto.ExpirationDate;
        }

        await _context.SaveChangesAsync();

        // Re-fetch the full DTO (includes User fields) for the response
        return await GetSubscriptionStatusAsync(userId);
    }
}
