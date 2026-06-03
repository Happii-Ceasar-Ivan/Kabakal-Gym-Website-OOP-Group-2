using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.Auth;

/// <summary>
/// Payload for POST /api/auth/forgot-password.
/// Only requires the user's email address.
/// </summary>
public sealed record ForgotPasswordRequestDto
{
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "A valid email address is required.")]
    public string Email { get; init; } = string.Empty;
}
