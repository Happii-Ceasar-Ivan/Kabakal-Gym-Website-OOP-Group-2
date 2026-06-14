namespace KabakalGym.API.DTOs.Ai;

/// <summary>
/// Returned after AI generates a routine — the routine is NOT auto-saved.
/// Frontend shows a "Save Routine" button using this data.
/// </summary>
public class GenerateRoutineResponseDto
{
    public string Goal { get; set; } = string.Empty;
    public string FitnessLevel { get; set; } = string.Empty;
    public int RemainingGenerations { get; set; }
    public List<RoutineDayDto> Days { get; set; } = [];
}

public class RoutineDayDto
{
    public string DayLabel { get; set; } = string.Empty;
    public string FocusArea { get; set; } = string.Empty;
    public bool IsRestDay { get; set; }
    public List<RoutineExerciseDto> Exercises { get; set; } = [];
}

public class RoutineExerciseDto
{
    public string ExerciseName { get; set; } = string.Empty;
    public string EquipmentName { get; set; } = string.Empty;
    public string Sets { get; set; } = string.Empty;
    public string Reps { get; set; } = string.Empty;
    public string StartingWeight { get; set; } = string.Empty;
}
