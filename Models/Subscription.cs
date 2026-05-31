using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KabakalGym.API.Models;

/// <summary>
/// User payment and subscription status. 1-to-1 with User.
/// </summary>
public class Subscription
{
    /// <summary>
    /// Primary Key and Foreign Key to User.
    /// </summary>
    [Key]
    public Guid UserId { get; set; }

    /// <summary>
    /// Status: Paid, Unpaid, Pending.
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string PaymentStatus { get; set; } = PaymentStatuses.Unpaid;

    /// <summary>
    /// Expiration timestamp. Null = no subscription history.
    /// </summary>
    public DateTime? ExpirationDate { get; set; }

    // ── Navigation ─────────────────────────────────────────────────────────
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}

/// <summary>
/// Allowed payment status values — enforced at the service layer.
/// </summary>
public static class PaymentStatuses
{
    public const string Paid    = "Paid";
    public const string Unpaid  = "Unpaid";
    public const string Pending = "Pending";
}
