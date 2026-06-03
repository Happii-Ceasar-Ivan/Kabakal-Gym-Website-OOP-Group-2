using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KabakalGym.API.Models;

/// <summary>
/// A specific daily workout session for a user.
/// Contains multiple RoutineList entries (exercises).
/// </summary>
public class Routine
{
    [Key]
    public Guid RoutineId { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    /// <summary>
    /// Display label (e.g., "Day 1").
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string DayLabel { get; set; } = string.Empty;

    /// <summary>
    /// Target area (e.g., "Push").
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string FocusArea { get; set; } = string.Empty;

    /// <summary>
    /// True if this is a rest day (no exercises).
    /// </summary>
    public bool IsRestDay { get; set; } = false;

    /// <summary>
    /// True when all exercises are finished.
    /// </summary>
    public bool IsCompleted { get; set; } = false;

    /// <summary>
    /// Target date for this routine.
    /// </summary>
    [Required]
    public DateOnly DateAssigned { get; set; }

    /// <summary>
    /// Timestamp of completion.
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    // ── Navigation ─────────────────────────────────────────────────────────
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public ICollection<RoutineList> RoutineLists { get; set; } = new List<RoutineList>();
}
