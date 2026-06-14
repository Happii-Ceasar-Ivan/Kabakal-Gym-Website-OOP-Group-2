using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.Ai;

/// <summary>
/// Request for AI-powered routine generation.
/// All fields are whitelist-only via RegularExpression to prevent prompt injection.
/// </summary>
public class GenerateRoutineRequestDto
{
    [Required]
    [RegularExpression(@"^(Build Muscle|Lose Weight|General Fitness|Strength Training)$",
        ErrorMessage = "Goal must be one of: Build Muscle, Lose Weight, General Fitness, Strength Training")]
    public string Goal { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^(Beginner|Intermediate|Advanced)$",
        ErrorMessage = "Fitness level must be one of: Beginner, Intermediate, Advanced")]
    public string FitnessLevel { get; set; } = string.Empty;

    [Required]
    [Range(3, 6, ErrorMessage = "Days per week must be between 3 and 6")]
    public int DaysPerWeek { get; set; }
}
