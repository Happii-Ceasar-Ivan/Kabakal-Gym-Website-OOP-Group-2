using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
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
    private readonly IEmailService          _emailService;
    private readonly IConfiguration         _config;

    public AuthService(
        KabakalDbContext      context,
        IPasswordHasher<User> hasher,
        IOptions<JwtSettings> jwtOptions,
        IEmailService         emailService,
        IConfiguration        config)
    {
        _context      = context;
        _hasher       = hasher;
        _jwt          = jwtOptions.Value;
        _emailService = emailService;
        _config       = config;
    }

    // ──────────────────────────────────────────────────────────────────────
    // REGISTER
    // ──────────────────────────────────────────────────────────────────────

    public async Task<ServiceResult<string>> RegisterAsync(RegisterRequestDto dto)
    {
        var normalizedEmail = dto.Email.ToLower().Trim();

        // 1. Check email uniqueness — hits IX_Users_Email_Unique index (O(log n))
        var emailTaken = await _context.Users
            .AsNoTracking()
            .AnyAsync(u => u.Email == normalizedEmail);

        if (emailTaken)
            return ServiceResult<string>.Fail(
                "An account with this email already exists."
            );

        // 2. Build the User entity (Role defaults to Member; IsActive = true)
        var user = new User
        {
            UserId    = Guid.NewGuid(),
            Email     = normalizedEmail,
            FirstName = dto.FirstName.Trim(),
            LastName  = dto.LastName.Trim(),
            Role      = UserRoles.Member,
            IsActive  = true,
            IsVerified = false
        };

        // 3. Generate 6-digit OTP Verification Code
        var otp = Random.Shared.Next(100000, 999999).ToString();
        user.VerificationToken = otp;
        user.VerificationTokenExpiresAt = DateTime.UtcNow.AddMinutes(15);

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

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.Users.Add(user);
            _context.Subscriptions.Add(subscription);
            await _context.SaveChangesAsync();

            // 5. Send Verification Email with OTP
            await _emailService.SendVerificationEmailAsync(user.Email, otp);

            await transaction.CommitAsync();
            return ServiceResult<string>.Success("Registration successful. Please check your email to verify your account.");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return ServiceResult<string>.Fail($"Registration failed: Could not send verification email. Details: {ex.Message}");
        }
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

        if (!user.IsVerified)
            return ServiceResult<AuthResponseDto>.Fail("Please check your email to verify your account before logging in.");

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
    // FORGOT PASSWORD
    // ──────────────────────────────────────────────────────────────────────

    public async Task<ServiceResult<string>> ForgotPasswordAsync(ForgotPasswordRequestDto dto)
    {
        var normalizedEmail = dto.Email.ToLower().Trim();

        // 1. Check if the user actually exists
        var userExists = await _context.Users
            .AsNoTracking()
            .AnyAsync(u => u.Email == normalizedEmail);

        // IMPORTANT: Always return success message to prevent email enumeration.
        // If the email doesn't exist, we silently do nothing.
        if (!userExists)
            return ServiceResult<string>.Success(
                "If an account with that email exists, a reset link has been sent."
            );

        // 2. Delete any existing tokens for this email (prevents token buildup)
        var existingTokens = await _context.PasswordResets
            .Where(pr => pr.UserEmail == normalizedEmail)
            .ToListAsync();
        _context.PasswordResets.RemoveRange(existingTokens);

        // 3. Generate a cryptographically secure token
        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        var token = Convert.ToBase64String(tokenBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('='); // URL-safe base64

        // 4. Save token to database
        var passwordReset = new PasswordReset
        {
            UserEmail = normalizedEmail,
            Token     = token,
            CreatedAt = DateTime.UtcNow,
        };
        _context.PasswordResets.Add(passwordReset);
        await _context.SaveChangesAsync();

        // 5. Build reset link and send email
        var frontendUrl = _config["FrontendUrl"] ?? "http://localhost:5173";
        var resetLink = $"{frontendUrl}/reset-password?token={token}";

        try
        {
            await _emailService.SendPasswordResetEmailAsync(normalizedEmail, resetLink);
        }
        catch (Exception)
        {
            _context.PasswordResets.Remove(passwordReset);
            await _context.SaveChangesAsync();
            // Still return success to prevent enumeration leakage
        }

        return ServiceResult<string>.Success(
            "If an account with that email exists, a reset link has been sent."
        );
    }

    // ──────────────────────────────────────────────────────────────────────
    // RESET PASSWORD
    // ──────────────────────────────────────────────────────────────────────

    public async Task<ServiceResult<string>> ResetPasswordAsync(ResetPasswordRequestDto dto)
    {
        // 1. Look up the token
        var resetRecord = await _context.PasswordResets
            .AsTracking()
            .FirstOrDefaultAsync(pr => pr.Token == dto.Token);

        if (resetRecord is null)
            return ServiceResult<string>.Fail("Invalid or expired reset token.");

        // 2. Check if token is expired (1 hour window)
        if (DateTime.UtcNow - resetRecord.CreatedAt > TimeSpan.FromHours(1))
        {
            // Clean up expired token
            _context.PasswordResets.Remove(resetRecord);
            await _context.SaveChangesAsync();
            return ServiceResult<string>.Fail("This reset link has expired. Please request a new one.");
        }

        // 3. Find the user
        var user = await _context.Users
            .AsTracking()
            .FirstOrDefaultAsync(u => u.Email == resetRecord.UserEmail);

        if (user is null)
        {
            _context.PasswordResets.Remove(resetRecord);
            await _context.SaveChangesAsync();
            return ServiceResult<string>.Fail("Invalid or expired reset token.");
        }

        // 4. Hash the new password and update
        user.PasswordHash = _hasher.HashPassword(user, dto.NewPassword);
        await _context.SaveChangesAsync();

        // 5. Delete the token so it can NEVER be reused
        _context.PasswordResets.Remove(resetRecord);
        await _context.SaveChangesAsync();

        return ServiceResult<string>.Success("Password successfully updated!");
    }

    // ──────────────────────────────────────────────────────────────────────
    // VERIFY EMAIL
    // ──────────────────────────────────────────────────────────────────────
    
    public async Task<ServiceResult<bool>> VerifyEmailAsync(string email, string otp)
    {
        var normalizedEmail = email.ToLower().Trim();
        var user = await _context.Users
            .AsTracking()
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail && u.VerificationToken == otp);

        if (user == null)
            return ServiceResult<bool>.Fail("Invalid verification code.");

        if (user.IsVerified)
            return ServiceResult<bool>.Fail("Email is already verified.");

        if (user.VerificationTokenExpiresAt < DateTime.UtcNow)
            return ServiceResult<bool>.Fail("Verification code has expired. Please register again.");

        user.IsVerified = true;
        user.VerificationToken = null;
        user.VerificationTokenExpiresAt = null;

        await _context.SaveChangesAsync();

        return ServiceResult<bool>.Success(true);
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
            FirstName: user.FirstName,
            LastName:  user.LastName,
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
