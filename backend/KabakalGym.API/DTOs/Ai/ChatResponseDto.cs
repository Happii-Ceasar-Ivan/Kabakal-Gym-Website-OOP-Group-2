namespace KabakalGym.API.DTOs.Ai;

/// <summary>
/// Chat response including remaining quota info for the frontend timer.
/// </summary>
public record ChatResponseDto(
    string Response,
    int RemainingPrompts,
    DateTime ResetsAt
);
