using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.Auth;

/// <summary>
/// Input model for POST /api/auth/register.
/// Validated by ASP.NET Core's model binding pipeline before the action body runs.
/// The controller checks ModelState.IsValid and returns 400 on failure —
/// no manual validation logic needed inside AuthService.
/// </summary>
public sealed class RegisterRequestDto
{
    [Required(ErrorMessage = "Email is required.")]
    [MaxLength(255, ErrorMessage = "Email must not exceed 255 characters.")]
    [EmailAddress(ErrorMessage = "A valid email address is required.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "First name is required.")]
    [MaxLength(100, ErrorMessage = "First name must not exceed 100 characters.")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required.")]
    [MaxLength(100, ErrorMessage = "Last name must not exceed 100 characters.")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [MinLength(8,   ErrorMessage = "Password must be at least 8 characters.")]
    [MaxLength(128, ErrorMessage = "Password must not exceed 128 characters.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Please confirm your password.")]
    [Compare(nameof(Password), ErrorMessage = "Passwords do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
