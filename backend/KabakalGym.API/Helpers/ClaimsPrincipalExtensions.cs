using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using KabakalGym.API.Models;

namespace KabakalGym.API.Helpers;

/// <summary>
/// ClaimsPrincipalExtensions
/// Centralizes JWT claim extraction used by all "me" endpoints.
///
/// IDOR PROTECTION: Every endpoint that operates on the calling user's data
/// calls GetUserId(this.User) instead of accepting a userId parameter.
/// This prevents a member from reading another member's data by swapping
/// the ID in the request body or query string.
///
/// CLAIM MAPPING NOTE:
/// JwtSecurityTokenHandler maps the "sub" claim to ClaimTypes.NameIdentifier
/// by default. This extension tries both to remain robust regardless of whether
/// the caller configured DefaultInboundClaimTypeMap.
/// </summary>
public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Extracts the authenticated user's UUID from the JWT "sub" claim.
    /// Throws InvalidOperationException if the claim is missing or malformed —
    /// this should never happen on a valid, middleware-validated JWT.
    /// </summary>
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        // JWT middleware maps "sub" → NameIdentifier by default.
        // Fallback to the raw JWT claim name for environments where the
        // default inbound claim type map has been cleared.
        var raw = principal.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? throw new InvalidOperationException(
                      "UserId claim ('sub' / NameIdentifier) is missing from the token. " +
                      "Verify AuthService.GenerateJwtToken() includes JwtRegisteredClaimNames.Sub."
                  );

        return Guid.TryParse(raw, out var userId)
            ? userId
            : throw new InvalidOperationException($"UserId claim is not a valid GUID: '{raw}'.");
    }

    /// <summary>Returns true if the authenticated user holds the Admin role.</summary>
    public static bool IsAdmin(this ClaimsPrincipal principal)
        => principal.IsInRole(UserRoles.Admin);

    /// <summary>Returns the role claim value ("Admin" or "Member").</summary>
    public static string GetRole(this ClaimsPrincipal principal)
        => principal.FindFirstValue(ClaimTypes.Role) ?? UserRoles.Member;
}
