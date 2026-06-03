using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KabakalGym.API.Models;

/// <summary>
/// Junction table linking Exercises to a Routine.
/// Represents a single workout exercise in a session.
/// </summary>
public class RoutineList
{
    [Key]
    public Guid RoutineListId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Sequence order in the workout (1, 2, 3...).
    /// </summary>
    [Required]
    public int OrderIndex { get; set; }

    [Required]
    public Guid RoutineId { get; set; }

    [Required]
    public Guid ExerciseId { get; set; }

    /// <summary>
    /// Target sets (e.g., "3-4").
    /// </summary>
    [Required]
    [MaxLength(10)]
    public string Sets { get; set; } = string.Empty;

    /// <summary>
    /// Target rep range (e.g., "8-12").
    /// </summary>
    [Required]
    [MaxLength(10)]
    public string Reps { get; set; } = string.Empty;

    /// <summary>
    /// Recommended starting weight based on experience.
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string StartingWeight { get; set; } = string.Empty;

    // ── Navigation ─────────────────────────────────────────────────────────
    [ForeignKey(nameof(RoutineId))]
    public Routine Routine { get; set; } = null!;

    [ForeignKey(nameof(ExerciseId))]
    public Exercise Exercise { get; set; } = null!;
}
