using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.Equipment;

public class BulkCreateEquipmentItemDto
{
    [Required]
    [MaxLength(100)]
    public string EquipmentName { get; set; } = string.Empty;

    [Required]
    [Range(1, 100)]
    public int Quantity { get; set; } = 1;

    [Url]
    [MaxLength(500)]
    public string? ImageUrl { get; set; }
}

public class BulkCreateEquipmentRequestDto
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one item is required.")]
    public List<BulkCreateEquipmentItemDto> Items { get; set; } = new();
}
