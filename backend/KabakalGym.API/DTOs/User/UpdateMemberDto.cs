using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.User;

public class UpdateMemberDto
{
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    public bool IsActive { get; set; }
}
