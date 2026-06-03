using KabakalGym.API.Common;
using KabakalGym.API.DTOs.Auth;

namespace KabakalGym.API.Services.Interfaces;

/// <summary>
/// IAuthService
/// Defines the authentication contract for the Kabakal Gym API.
///
/// OOP Abstraction: AuthController, unit tests, and any future auth middleware
/// depend on this interface — never on AuthService directly. Swapping the
/// implementation (e.g. adding OAuth in a future sprint) requires zero changes
/// in the controller layer.
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Registers a new Member account.
    /// Returns Fail(...) if the email is already taken.
    /// Returns Success(AuthResponseDto) with a JWT on success.
    /// Also bootstraps a default Unpaid Subscription row for the new user.
    /// </summary>
    Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterRequestDto dto);

    /// <summary>
    /// Authenticates with email + password.
    /// Returns Fail("Invalid credentials.") for BOTH wrong email AND wrong password
    /// to prevent user enumeration via differential error messages.
    /// Returns Success(AuthResponseDto) with a JWT on success.
    /// </summary>
    Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginRequestDto dto);
}
