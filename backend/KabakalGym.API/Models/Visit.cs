using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KabakalGym.API.Models;

/// <summary>
/// Table 4: Visits
/// Stores check-in and check-out timestamps for attendance tracking.
/// Created on a successful QR code scan + GPS geofence validation (Sprint 5).
/// 
/// CheckIn and CheckOut timestamps are consumed by the Sprint 7 Analytics
/// Engine to generate peak-usage hour histograms.
/// </summary>
public class Visit
{
    [Key]
    public Guid VisitId { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    /// <summary>
    /// The exact UTC timestamp at which the QR code was scanned for entry.
    /// Default NOW() applied. Never nullable — a Visit record cannot exist
    /// without a CheckIn.
    /// </summary>
    public DateTime CheckIn { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// The exact UTC timestamp at which the QR code was scanned for exit.
    /// NULL until the member scans out. Used to compute session duration
    /// for histogram bucketing (e.g., peak 6 PM – 8 PM traffic bands).
    /// </summary>
    public DateTime? CheckOut { get; set; }

    /// <summary>
    /// True if the user has an active subscription when checking in, OR if Staff manually accepted the day pass cash payment.
    /// False if pending payment.
    /// </summary>
    public bool IsApproved { get; set; } = true;

    // ── Navigation ─────────────────────────────────────────────────────────
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}
