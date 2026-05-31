using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using KabakalGym.API.Common;
using KabakalGym.API.Configuration;
using KabakalGym.API.Data;
using KabakalGym.API.DTOs.Auth;
using KabakalGym.API.Models;
using KabakalGym.API.Services.Interfaces;

namespace KabakalGym.API.Services;

/// <summary>
/// AuthService
/// Implements registration, login, and JWT generation.
///
/// PASSWORD HASHING: Uses IPasswordHasher&lt;User&gt; from Microsoft.AspNetCore.Identity.
/// This is ONLY the hasher component — NOT the full Identity framework (no AspNetUsers
/// table, no UserManager, no RoleManager). We use our custom Users table and RBAC.
///
/// JWT: HMAC-SHA512 signed tokens. Minimum 64-byte key enforced by the algorithm.
/// Token contains: sub (UserId), email, role, jti (unique token ID), iat.
///
/// ENUMERATION RESISTANCE: LoginAsync returns the same message for both
/// "user not found" and "wrong password" paths. Both paths take a similar
/// code path to avoid timing-based enumeration.
/// </summary>
public sealed class AuthService : IAuthService
{
    private readonly KabakalDbContext       _context;
    private readonly IPasswordHasher<User>  _hasher;
    private readonly JwtSettings            _jwt;

    public AuthService(
        KabakalDbContext      context,
        IPasswordHasher<User> hasher,
        IOptions<JwtSettings> jwtOptions)
    {
        _context = context;
        _hasher  = hasher;
        _jwt     = jwtOptions.Value;
    }

    // ──────────────────────────────────────────────────────────────────────
    // REGISTER
    // ──────────────────────────────────────────────────────────────────────

    public async Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterRequestDto dto)
    {
        var normalizedEmail = dto.Email.ToLower().Trim();

        // 1. Check email uniqueness — hits IX_Users_Email_Unique index (O(log n))
        var emailTaken = await _context.Users
            .AsNoTracking()
            .AnyAsync(u => u.Email == normalizedEmail);

        if (emailTaken)
            return ServiceResult<AuthResponseDto>.Fail(
                "An account with this email already exists."
            );

        // 2. Build the User entity (Role defaults to Member; IsActive = true)
        var user = new User
        {
            UserId   = Guid.NewGuid(),
            Email    = normalizedEmail,
            Role     = UserRoles.Member,
            IsActive = true,
        };

        // Hash AFTER UserId is assigned — PasswordHasher may embed the user ID
        // as entropy depending on implementation version.
        user.PasswordHash = _hasher.HashPassword(user, dto.Password);

        // 3. Bootstrap a default Subscription row in the same DB round-trip.
        //    Every user always has a Subscription record from day one so that
        //    Sprint 3 membership-check queries can use a simple INNER JOIN
        //    rather than a nullable LEFT JOIN.
        var subscription = new Subscription
        {
            UserId         = user.UserId,
            PaymentStatus  = PaymentStatuses.Unpaid,
            ExpirationDate = null,
        };

        _context.Users.Add(user);
        _context.Subscriptions.Add(subscription);
        await _context.SaveChangesAsync();

        return ServiceResult<AuthResponseDto>.Success(BuildAuthResponse(user));
    }

    // ──────────────────────────────────────────────────────────────────────
    // LOGIN
    // ──────────────────────────────────────────────────────────────────────

    public async Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginRequestDto dto)
    {
        var normalizedEmail = dto.Email.ToLower().Trim();
        const string genericError = "Invalid credentials.";

        // 1. Find user by email — hits IX_Users_Email_Unique index
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        // 2. Soft-delete / not-found guard.
        //    IMPORTANT: returns identical message to "wrong password" to
        //    prevent enumeration via differential error responses.
        if (user is null || !user.IsActive)
            return ServiceResult<AuthResponseDto>.Fail(genericError);

        // 3. Verify password hash (timing-safe internally)
        var verifyResult = _hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);

        if (verifyResult == PasswordVerificationResult.Failed)
            return ServiceResult<AuthResponseDto>.Fail(genericError);

        // 4. Handle hash algorithm upgrade path.
        //    SuccessRehashNeeded is returned when the hash was created with an
        //    older/weaker algorithm. Re-hash transparently on next successful login.
        if (verifyResult == PasswordVerificationResult.SuccessRehashNeeded)
        {
            // Re-query WITH tracking so EF can issue an UPDATE
            var trackedUser = await _context.Users.FindAsync(user.UserId);
            if (trackedUser is not null)
            {
                trackedUser.PasswordHash = _hasher.HashPassword(trackedUser, dto.Password);
                await _context.SaveChangesAsync();
                user = trackedUser; // Use updated entity for token generation
            }
        }

        return ServiceResult<AuthResponseDto>.Success(BuildAuthResponse(user));
    }

    // ──────────────────────────────────────────────────────────────────────
    // PRIVATE: JWT + RESPONSE BUILDER
    // ──────────────────────────────────────────────────────────────────────

    private AuthResponseDto BuildAuthResponse(User user)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(_jwt.ExpiresInMinutes);
        var token     = GenerateJwtToken(user, expiresAt);

        return new AuthResponseDto(
            Token:     token,
            ExpiresAt: expiresAt,
            UserId:    user.UserId,
            Email:     user.Email,
            Role:      user.Role
        );
    }

    /// <summary>
    /// Generates a signed JWT using HMAC-SHA512.
    ///
    /// Claims included:
    ///   sub   — UserId (GUID string) — standard subject claim
    ///   email — normalized email
    ///   role  — "Admin" or "Member" — consumed by [Authorize(Roles = "Admin")]
    ///   jti   — unique token ID — enables server-side revocation in Sprint 3+
    ///   iat   — issued-at Unix timestamp
    /// </summary>
    private string GenerateJwtToken(User user, DateTime expiresAt)
    {
        var key          = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.SecretKey));
        var signingCreds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.UserId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role,               user.Role),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat,
                DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64),
        };

        var token = new JwtSecurityToken(
            issuer:             _jwt.Issuer,
            audience:           _jwt.Audience,
            claims:             claims,
            notBefore:          DateTime.UtcNow,
            expires:            expiresAt,
            signingCredentials: signingCreds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
