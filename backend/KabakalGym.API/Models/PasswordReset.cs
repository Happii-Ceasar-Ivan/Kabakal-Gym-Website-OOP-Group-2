using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.Models;

/// <summary>
/// Stores a one-time-use password reset token.
/// Tokens expire after 1 hour and are deleted upon use.
/// </summary>
public class PasswordReset
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string UserEmail { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// UTC timestamp when the token was generated.
    /// Used to enforce the 1-hour expiry window.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
