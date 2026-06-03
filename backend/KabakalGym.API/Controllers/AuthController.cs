using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using KabakalGym.API.DTOs.Auth;
using KabakalGym.API.Services.Interfaces;

namespace KabakalGym.API.Controllers;

/// <summary>
/// AuthController
/// Handles user registration and authentication.
///
/// Both endpoints apply the "AuthPolicy" rate limiter configured in Program.cs:
/// 10 requests per 10 minutes per IP. This throttles credential-stuffing and
/// brute-force attacks without impacting normal user flows.
///
/// Routes:
///   POST /api/auth/register  — create a Member account, returns JWT
///   POST /api/auth/login     — authenticate, returns JWT
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // ──────────────────────────────────────────────────────────────────────
    // POST /api/auth/register
    // ──────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Creates a new Member account and returns a signed JWT.
    /// New users start with PaymentStatus = Unpaid (no active subscription).
    /// </summary>
    /// <param name="dto">Registration payload: email, password, confirmPassword.</param>
    /// <returns>201 + AuthResponseDto on success; 409 if email is already taken.</returns>
    [HttpPost("register")]
    [EnableRateLimiting("AuthPolicy")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object),           StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object),           StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
    {
        // Model annotations ([Required], [EmailAddress], [Compare]) are
        // validated before this line runs — ApiController attribute ensures
        // automatic 400 on ModelState failure.
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.RegisterAsync(dto);

        if (!result.IsSuccess)
            return Conflict(new { error = result.ErrorMessage });

        // 201 Created — new resource was successfully created
        return StatusCode(StatusCodes.Status201Created, result.Data);
    }

    // ──────────────────────────────────────────────────────────────────────
    // POST /api/auth/login
    // ──────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Authenticates an existing user and returns a signed JWT.
    /// Returns 401 for both "email not found" AND "wrong password" — identical
    /// responses prevent email enumeration via differential error messages.
    /// </summary>
    /// <param name="dto">Login payload: email + password.</param>
    /// <returns>200 + AuthResponseDto on success; 401 on any credential failure.</returns>
    [HttpPost("login")]
    [EnableRateLimiting("AuthPolicy")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object),           StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object),           StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.LoginAsync(dto);

        if (!result.IsSuccess)
            return Unauthorized(new { error = result.ErrorMessage });

        return Ok(result.Data);
    }
}
