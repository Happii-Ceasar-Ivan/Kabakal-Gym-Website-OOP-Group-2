using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.Subscription;

/// <summary>
/// UpdateSubscriptionDto
/// Admin-only payload for PATCH /api/subscription/{userId}.
///
/// Used for:
///   - Correcting a payment status (e.g. marking Pending → Paid after GCash confirmation)
///   - Manually adjusting ExpirationDate (e.g. admin-granted grace period)
///
/// For recording actual payments, use POST /api/transaction instead —
/// that endpoint creates a Transaction ledger entry AND updates the subscription
/// in a single operation with automatic ExpirationDate calculation.
/// </summary>
public sealed class UpdateSubscriptionDto
{
    [Required(ErrorMessage = "PaymentStatus is required.")]
    [RegularExpression(
        "^(Paid|Unpaid|Pending)$",
        ErrorMessage = "PaymentStatus must be one of: Paid, Unpaid, Pending."
    )]
    public string PaymentStatus { get; set; } = string.Empty;

    /// <summary>
    /// Optional manual expiry override. Must be a future UTC datetime.
    /// If null, ExpirationDate is not changed.
    /// </summary>
    public DateTime? ExpirationDate { get; set; }
}
