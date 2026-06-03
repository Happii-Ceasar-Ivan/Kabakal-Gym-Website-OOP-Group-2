namespace KabakalGym.API.Common;

/// <summary>
/// ServiceResult&lt;T&gt;
/// Discriminated-union-style return type for service methods.
///
/// Replaces throwing exceptions for expected business-logic failure cases
/// (e.g. "email already taken", "invalid credentials"). Exceptions should
/// only propagate for truly unexpected infrastructure failures (DB down, etc.)
/// which the global exception handler in Program.cs catches and converts to
/// a clean 500 JSON response.
///
/// Controller pattern:
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
