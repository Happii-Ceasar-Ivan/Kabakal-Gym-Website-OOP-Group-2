using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.Auth;

/// <summary>
/// Payload for POST /api/auth/reset-password.
/// The token comes from the reset link email; the user provides a new password.
/// </summary>
public sealed record ResetPasswordRequestDto
{
    [Required(ErrorMessage = "Reset token is required.")]
    public string Token { get; init; } = string.Empty;

    [Required(ErrorMessage = "New password is required.")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
    public string NewPassword { get; init; } = string.Empty;

    [Required(ErrorMessage = "Please confirm your new password.")]
    [Compare(nameof(NewPassword), ErrorMessage = "Passwords do not match.")]
    public string ConfirmNewPassword { get; init; } = string.Empty;
}
