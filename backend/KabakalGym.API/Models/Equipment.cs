using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.Models;

/// <summary>
/// Physical gym equipment. 
/// If unavailable, linked exercises are excluded from recommendations.
/// </summary>
public class Equipment
{
    [Key]
    public Guid EquipmentId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Status values: Available, Under Maintenance, Unavailable.
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string EquipmentStatus { get; set; } = "Available";

    [Required]
    [MaxLength(100)]
    public string EquipmentName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    // ── Navigation ─────────────────────────────────────────────────────────
    public ICollection<Exercise> Exercises { get; set; } = new List<Exercise>();
}
