using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.Auth;

public class VerifyEmailRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Otp { get; set; } = string.Empty;
}
