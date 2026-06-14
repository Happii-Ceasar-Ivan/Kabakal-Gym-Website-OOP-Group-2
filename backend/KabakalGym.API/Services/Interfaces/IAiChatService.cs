using KabakalGym.API.Common;
using KabakalGym.API.DTOs.Ai;

namespace KabakalGym.API.Services.Interfaces;

public interface IAiChatService
{
    /// <summary>
    /// Send a fitness/nutrition chat message to the AI.
    /// Enforces tier-based prompt limits (5/30min for daily, 15/30min for subscribers).
    /// </summary>
    Task<ServiceResult<ChatResponseDto>> ChatAsync(Guid userId, string message);

    /// <summary>
    /// Get current AI usage stats for the authenticated user.
    /// </summary>
    Task<ServiceResult<AiUsageDto>> GetUsageAsync(Guid userId);
}

/// <summary>
/// Current AI usage stats returned to the frontend for timer display.
/// </summary>
public record AiUsageDto(
    int ChatPromptsUsed,
    int ChatPromptsMax,
    DateTime ChatResetsAt,
    int RoutinesGeneratedThisWeek,
    int RoutinesMax,
    DateTime RoutineWeekResetsAt,
    bool IsSubscriber
);
