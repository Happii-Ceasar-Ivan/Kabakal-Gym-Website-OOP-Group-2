using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace KabakalGym.API.Models;

/// <summary>
/// Immutable financial ledger entry generated upon checkout.
/// Used for revenue and payment method analytics.
/// </summary>
public class Transaction
{
    [Key]
    public Guid TransactionId { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    /// <summary>
    /// Price paid (e.g., 50.00 for Day Pass).
    /// </summary>
    [Required]
    [Precision(10, 2)]
    [Range(0.01, 999999.99)]
    public decimal AmountPaid { get; set; }

    /// <summary>
    /// Supported: Cash, GCash, Card, QR-Code.
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string PaymentMethod { get; set; } = string.Empty;

    // Default to Paid for legacy manual transactions
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Paid"; // Pending, Paid, Failed

    // To link with Xendit
    [MaxLength(100)]
    public string? ExternalInvoiceId { get; set; }

    /// <summary>
    /// UTC timestamp of the payment event.
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // ── Navigation ─────────────────────────────────────────────────────────
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}
