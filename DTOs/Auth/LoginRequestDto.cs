using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.Auth;

/// <summary>
/// Input model for POST /api/auth/login.
///
/// SECURITY NOTE: This DTO only validates format — it does NOT reveal
/// whether the email exists in the system. AuthService.LoginAsync()
/// returns the same "Invalid credentials." message for both
/// "email not found" and "wrong password" to prevent user enumeration.
/// </summary>
public sealed class LoginRequestDto
{
    [Required(ErrorMessage = "Email is required.")]
    [MaxLength(255)]
    [EmailAddress(ErrorMessage = "A valid email address is required.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [MaxLength(128)]
    public string Password { get; set; } = string.Empty;
}
