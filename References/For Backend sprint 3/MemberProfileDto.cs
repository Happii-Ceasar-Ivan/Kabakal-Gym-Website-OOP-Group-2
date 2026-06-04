namespace KabakalGym.API.DTOs.User;

/// <summary>
/// MemberProfileDto
/// Admin-only read model for the member management list.
/// Returned by GET /api/subscription/members (paginated).
///
/// Embeds subscription state so the admin dashboard can render
/// membership status, expiry, and soft-delete flags in a single query —
/// no secondary round-trips from the client.
/// </summary>
public sealed record MemberProfileDto(
    Guid      UserId,
    string    Email,
    string    FirstName,
    string    LastName,

    /// <summary>"Admin" or "Member"</summary>
    string    Role,

    /// <summary>False = account is soft-deleted; login is blocked.</summary>
    bool      IsAccountActive,

    // ── Subscription state ──────────────────────────────────────────────
    /// <summary>"Paid" | "Unpaid" | "Pending" — null if no subscription row yet.</summary>
    string?   PaymentStatus,

    /// <summary>UTC expiry — null if never paid.</summary>
    DateTime? ExpirationDate,

    /// <summary>
    /// True if the subscription is expired or unpaid.
    /// Computed server-side for direct binding to the admin UI badge color.
    /// </summary>
    bool      IsExpired
);
