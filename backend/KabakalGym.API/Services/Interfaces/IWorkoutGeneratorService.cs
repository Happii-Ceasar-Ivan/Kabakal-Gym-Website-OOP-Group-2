using KabakalGym.API.Common;
using KabakalGym.API.DTOs.Ai;

namespace KabakalGym.API.Services.Interfaces;

public interface IWorkoutGeneratorService
{
    /// <summary>
    /// Generate a weekly workout routine using the Gemini API.
    /// Only includes exercises for equipment currently marked as Available.
    /// </summary>
    Task<ServiceResult<GenerateRoutineResponseDto>> GenerateRoutineAsync(
        Guid userId, GenerateRoutineRequestDto request);

    /// <summary>
    /// Save a generated routine to the database (user explicitly clicked "Save").
    /// </summary>
    Task<ServiceResult<Guid>> SaveRoutineAsync(Guid userId, SaveRoutineRequestDto request);

    /// <summary>
    /// Download a saved routine as structured JSON for frontend card rendering.
    /// </summary>
    Task<ServiceResult<GenerateRoutineResponseDto>> DownloadRoutineAsync(Guid userId, Guid routineId);
}
