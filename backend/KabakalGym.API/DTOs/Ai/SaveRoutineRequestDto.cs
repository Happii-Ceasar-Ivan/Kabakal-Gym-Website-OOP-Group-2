using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.Ai;

/// <summary>
/// Request to persist a generated routine to the database.
/// Only called when the user explicitly clicks "Save Routine".
/// </summary>
public class SaveRoutineRequestDto
{
    [Required]
    public string Goal { get; set; } = string.Empty;

    [Required]
    public string FitnessLevel { get; set; } = string.Empty;

    [Required]
    public List<SaveRoutineDayDto> Days { get; set; } = [];
}

public class SaveRoutineDayDto
{
    [Required]
    [MaxLength(20)]
    public string DayLabel { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FocusArea { get; set; } = string.Empty;

    public bool IsRestDay { get; set; }

    public List<SaveRoutineExerciseDto> Exercises { get; set; } = [];
}

public class SaveRoutineExerciseDto
{
    [Required]
    public string ExerciseName { get; set; } = string.Empty;

    [Required]
    public string Sets { get; set; } = string.Empty;

    [Required]
    public string Reps { get; set; } = string.Empty;

    [Required]
    public string StartingWeight { get; set; } = string.Empty;
}
