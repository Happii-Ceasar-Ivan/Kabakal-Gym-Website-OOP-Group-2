using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.Transaction;

/// <summary>
/// RecordTransactionDto
/// Admin-only payload for POST /api/transaction.
///
/// This single request triggers two DB operations (atomic):
///   1. INSERT into Transactions — immutable financial ledger entry
///   2. UPDATE Subscriptions — PaymentStatus → "Paid", ExpirationDate extended
///
/// PlanType is intentionally NOT persisted on the Transaction entity.
/// It is used exclusively to compute the ExpirationDate offset and is
/// then discarded. This preserves the SRS-defined Transactions schema.
/// </summary>
public sealed class RecordTransactionDto
{
    [Required(ErrorMessage = "UserId of the paying member is required.")]
    public Guid UserId { get; set; }

    [Required(ErrorMessage = "AmountPaid is required.")]
    [Range(0.01, 999999.99, ErrorMessage = "AmountPaid must be a positive value.")]
    public decimal AmountPaid { get; set; }

    /// <summary>Accepted values: Cash | GCash | Card | QR-Code (matches DB check constraint).</summary>
    [Required(ErrorMessage = "PaymentMethod is required.")]
    [RegularExpression(
        "^(Cash|GCash|Card|QR-Code)$",
        ErrorMessage = "PaymentMethod must be one of: Cash, GCash, Card, QR-Code."
    )]
    public string PaymentMethod { get; set; } = string.Empty;

    /// <summary>
    /// Accepted values: Day | Monthly | Annual
    /// Determines how many days to add to the member's ExpirationDate.
    ///   Day     →  +1 day
    ///   Monthly → +30 days
    ///   Annual  → +365 days
    /// If the member's current subscription has not yet expired, the new
    /// period is STACKED on top of the existing ExpirationDate.
    /// </summary>
    [Required(ErrorMessage = "PlanType is required.")]
    [RegularExpression(
        "^(Day|Monthly|Annual)$",
        ErrorMessage = "PlanType must be one of: Day, Monthly, Annual."
    )]
    public string PlanType { get; set; } = string.Empty;
}
