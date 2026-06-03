using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KabakalGym.API.Models;

/// <summary>
/// A specific exercise available in the gym.
/// Tagged with muscle group and movement type for filtering.
/// </summary>
public class Exercise
{
    [Key]
    public Guid ExerciseId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Required equipment for this exercise.
    /// </summary>
    [Required]
    public Guid EquipmentId { get; set; }

    /// <summary>
    /// Name of the exercise.
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string ExerciseName { get; set; } = string.Empty;

    /// <summary>
    /// Target muscles (e.g., "Chest", "Legs").
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string MuscleGroup { get; set; } = string.Empty;

    /// <summary>
    /// Movement category (e.g., "Push", "Hinge").
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string MovementType { get; set; } = string.Empty;

    /// <summary>
    /// Backup exercise if primary equipment is unavailable.
    /// </summary>
    [MaxLength(100)]
    public string? AlternativeExerciseName { get; set; }

    public bool IsActive { get; set; } = true;

    // ── Navigation ─────────────────────────────────────────────────────────
    [ForeignKey(nameof(EquipmentId))]
    public Equipment Equipment { get; set; } = null!;

    public ICollection<RoutineList> RoutineLists { get; set; } = new List<RoutineList>();
}
