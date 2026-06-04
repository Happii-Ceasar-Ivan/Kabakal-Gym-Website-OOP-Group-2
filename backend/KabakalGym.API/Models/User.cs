using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.Models;

/// <summary>
/// User credentials and RBAC roles.
/// Passwords are hashed via .NET Identity.
/// </summary>
public class User
{
    [Key]
    public Guid UserId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Unique email address for login.
    /// </summary>
    [Required]
    [MaxLength(255)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// Bcrypt password hash.
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// User role (e.g., "Admin", "Member").
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Role { get; set; } = UserRoles.Member;

    /// <summary>
    /// Soft delete flag. False = deleted.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// True if the user has confirmed their email address.
    /// </summary>
    public bool IsVerified { get; set; } = false;

    /// <summary>
    /// Secure token for email verification.
    /// </summary>
    [MaxLength(255)]
    public string? VerificationToken { get; set; }

    /// <summary>
    /// Expiration time for the verification token.
    /// </summary>
    public DateTime? VerificationTokenExpiresAt { get; set; }

    // ── Navigation ─────────────────────────────────────────────────────────
    public Subscription? Subscription { get; set; }
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<Visit> Visits { get; set; } = new List<Visit>();
    public ICollection<Routine> Routines { get; set; } = new List<Routine>();
}

/// <summary>
/// Static role constants — single source of truth to prevent magic strings
/// throughout the codebase.
/// </summary>
public static class UserRoles
{
    public const string Admin  = "Admin";
    public const string Member = "Member";
}
