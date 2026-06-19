namespace KabakalGym.API.Common;

/// <summary>
/// Generic service result type for business operations.
///
/// Use for expected failures like "email already taken" or "invalid credentials"
/// instead of throwing exceptions. Unexpected infrastructure errors still throw
/// and are handled by the global exception middleware.
///
/// Example:
///   var result = await _authService.RegisterAsync(dto);
///   if (!result.IsSuccess) return Conflict(new { error = result.ErrorMessage });
///   return Created(..., result.Data);
/// </summary>
public sealed class ServiceResult<T>
{
    public bool    IsSuccess    { get; }
    public T?      Data         { get; }
    public string? ErrorMessage { get; }

    private ServiceResult(bool success, T? data, string? error)
    {
        IsSuccess    = success;
        Data         = data;
        ErrorMessage = error;
    }

    /// <summary>Creates a successful result carrying the return value.</summary>
    public static ServiceResult<T> Success(T data) => new(true, data, null);

    /// <summary>Creates a failed result carrying a user-safe error message.</summary>
    public static ServiceResult<T> Fail(string message) => new(false, default, message);
}
