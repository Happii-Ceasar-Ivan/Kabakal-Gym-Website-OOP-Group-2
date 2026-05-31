namespace KabakalGym.API.DTOs.Auth;

/// <summary>
/// Response payload returned by both /register and /login on success.
///
/// The frontend should:
///   1. Store Token in memory (or httpOnly cookie — NOT localStorage) for API calls.
///   2. Store ExpiresAt to trigger silent re-login before the token expires.
///   3. Use Role to conditionally render Admin vs Member UI routes.
///
/// NOTE: The User entity is NEVER returned directly. This DTO is the
/// public contract — adding/removing User fields never breaks the API surface.
/// </summary>
public sealed record AuthResponseDto(
    /// <summary>Signed JWT — include as "Authorization: Bearer {Token}" on protected calls.</summary>
    string   Token,

    /// <summary>UTC expiry timestamp of the token.</summary>
    DateTime ExpiresAt,

    /// <summary>The authenticated user's UUID primary key.</summary>
    Guid     UserId,

    /// <summary>Normalized (lowercase) email address.</summary>
    string   Email,

    /// <summary>"Admin" or "Member" — drives frontend RBAC routing.</summary>
    string   Role
);
