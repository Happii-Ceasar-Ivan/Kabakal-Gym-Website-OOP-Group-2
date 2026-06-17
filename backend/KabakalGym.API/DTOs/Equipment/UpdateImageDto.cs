using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.Equipment;

/// <summary>
/// DTO for updating an equipment image URL after a Cloudinary upload.
/// </summary>
public class UpdateImageDto
{
    [Required]
    [Url]
    [MaxLength(500)]
    public string ImageUrl { get; set; } = string.Empty;
}
