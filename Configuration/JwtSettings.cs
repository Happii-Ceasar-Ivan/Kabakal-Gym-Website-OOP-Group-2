namespace KabakalGym.API.Configuration;

/// <summary>
/// JwtSettings
/// Bound to the "Jwt" section of appsettings.json via IOptions&lt;JwtSettings&gt;.
/// Injected into AuthService — never read Configuration directly inside services.
///
/// PRODUCTION REQUIREMENT:
///   SecretKey must be overridden via environment variable:
///   JWT__SECRETKEY="&lt;64+ character random string&gt;"
///
///   Generate a secure key with:
///   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
///   OR
///   openssl rand -hex 64
///
///   A key shorter than 64 bytes will cause HmacSha512 to throw at startup.
/// </summary>
public sealed class JwtSettings
{
    /// <summary>Config section key — used in builder.Configuration.GetSection(...).</summary>
    public const string SectionName = "Jwt";

    /// <summary>
    /// HMAC-SHA512 signing key. Minimum 64 characters in production.
    /// Never commit a real value here — use environment variable JWT__SECRETKEY.
    /// </summary>
    public string SecretKey { get; set; } = string.Empty;

    /// <summary>Token issuer — must match ValidIssuer in TokenValidationParameters.</summary>
    public string Issuer { get; set; } = "KabakalGymAPI";

    /// <summary>Token audience — must match ValidAudience in TokenValidationParameters.</summary>
    public string Audience { get; set; } = "KabakalGymClient";

    /// <summary>
    /// Access token lifetime in minutes.
    /// Default: 1440 (24 hours) for Sprint 2 development convenience.
    /// Recommended production value: 15 minutes with refresh token rotation (Sprint 3+).
    /// </summary>
    public int ExpiresInMinutes { get; set; } = 1440;
}
