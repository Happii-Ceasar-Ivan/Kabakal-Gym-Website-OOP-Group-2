namespace KabakalGym.API.DTOs.Subscription;

/// <summary>
/// SubscriptionStatusDto
/// Read response for a single member's subscription state.
/// Returned by GET /api/subscription/me and GET /api/subscription/{userId}.
///
/// IsExpired is computed server-side so the frontend never needs to
/// perform UTC date arithmetic. A member whose PaymentStatus is "Paid" but
/// ExpirationDate is in the past is treated as expired regardless of status.
/// </summary>
public sealed record SubscriptionStatusDto(
    Guid      UserId,
    string    Email,
    string    FirstName,
    string    LastName,

    /// <summary>"Paid" | "Unpaid" | "Pending"</summary>
    string    PaymentStatus,

    /// <summary>UTC datetime when the subscription expires. Null = never paid.</summary>
    DateTime? ExpirationDate,

    /// <summary>
    /// True if ExpirationDate has passed (UTC) OR PaymentStatus is not "Paid".
    /// The authoritative access gate for QR Check-In and Workout Engine (Sprint 5+).
    /// </summary>
    bool      IsExpired,

    /// <summary>False = account is soft-deleted; access always denied regardless of subscription.</summary>
    bool      IsAccountActive
);
