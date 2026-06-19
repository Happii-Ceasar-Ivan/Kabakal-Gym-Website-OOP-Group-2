using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.Ai;

/// <summary>
/// Request for AI-powered routine generation.
/// All fields are whitelist-only via RegularExpression to prevent prompt injection.
/// </summary>
public class GenerateRoutineRequestDto
{
    [Required]
    public string FitnessGoal { get; set; } = string.Empty;

    [Required]
    public string TargetSplit { get; set; } = string.Empty;

    [Required]
    public string ExperienceLevel { get; set; } = string.Empty;
}
