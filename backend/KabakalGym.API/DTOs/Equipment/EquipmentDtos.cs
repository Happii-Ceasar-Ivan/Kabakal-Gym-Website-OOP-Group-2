using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.Equipment;

public record EquipmentDto(
    Guid EquipmentId,
    string EquipmentName,
    string EquipmentStatus,
    bool IsActive
);

public class CreateEquipmentDto
{
    [Required]
    [MaxLength(100)]
    public string EquipmentName { get; set; } = string.Empty;
}

public class UpdateEquipmentDto
{
    [Required]
    [MaxLength(100)]
    public string EquipmentName { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    // Should be Available, Under Maintenance, Unavailable
    public string EquipmentStatus { get; set; } = "Available";

    public bool IsActive { get; set; }
}
