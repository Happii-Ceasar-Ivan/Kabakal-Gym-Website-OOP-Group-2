using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using KabakalGym.API.DTOs.Ai;
using KabakalGym.API.Helpers;
using KabakalGym.API.Services.Interfaces;

namespace KabakalGym.API.Controllers;

/// <summary>
/// AI-powered fitness chatbot and workout generator endpoints.
/// All endpoints require authentication.
/// </summary>
[ApiController]
[Route("api/ai")]
[Authorize]
[EnableRateLimiting("AiChatPolicy")]
public class AiController : ControllerBase
{
    private readonly IAiChatService _chatService;
    private readonly IWorkoutGeneratorService _workoutService;

    public AiController(IAiChatService chatService, IWorkoutGeneratorService workoutService)
    {
        _chatService = chatService;
        _workoutService = workoutService;
    }

    // ── CHAT ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Send a fitness/nutrition question to KG Coach.
    /// Daily users: 5 prompts per 30 minutes.
    /// Subscribers: 15 prompts per 30 minutes.
    /// </summary>
    [HttpPost("chat")]
    [ProducesResponseType(typeof(ChatResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Chat([FromBody] ChatRequestDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = User.GetUserId();
        var result = await _chatService.ChatAsync(userId, dto.Message);

        if (!result.IsSuccess)
        {
            // Check if it's a rate limit error
            if (result.ErrorMessage!.Contains("prompts"))
                return StatusCode(StatusCodes.Status429TooManyRequests,
                    new { error = result.ErrorMessage });

            return BadRequest(new { error = result.ErrorMessage });
        }

        return Ok(result.Data);
    }

    // ── ROUTINE GENERATION ───────────────────────────────────────────────

    /// <summary>
    /// Generate a personalized weekly workout routine using AI.
    /// Daily users: 1 per week. Subscribers: 3 per week.
    /// </summary>
    [HttpPost("generate-routine")]
    [ProducesResponseType(typeof(GenerateRoutineResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> GenerateRoutine([FromBody] GenerateRoutineRequestDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = User.GetUserId();
        var result = await _workoutService.GenerateRoutineAsync(userId, dto);

        if (!result.IsSuccess)
        {
            if (result.ErrorMessage!.Contains("limit"))
                return StatusCode(StatusCodes.Status429TooManyRequests,
                    new { error = result.ErrorMessage });

            return BadRequest(new { error = result.ErrorMessage });
        }

        return Ok(result.Data);
    }

    // ── SAVE ROUTINE ─────────────────────────────────────────────────────

    /// <summary>
    /// Save a generated routine to the database.
    /// Only called when user explicitly clicks "Save Routine".
    /// </summary>
    [HttpPost("save-routine")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> SaveRoutine([FromBody] SaveRoutineRequestDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = User.GetUserId();
        var result = await _workoutService.SaveRoutineAsync(userId, dto);

        if (!result.IsSuccess)
            return BadRequest(new { error = result.ErrorMessage });

        return StatusCode(StatusCodes.Status201Created,
            new { routineId = result.Data, message = "Routine saved successfully! 💪" });
    }

    // ── DOWNLOAD ROUTINE ─────────────────────────────────────────────────

    /// <summary>
    /// Download a saved routine as structured JSON for frontend card rendering.
    /// </summary>
    [HttpGet("routine/{routineId:guid}/download")]
    [ProducesResponseType(typeof(GenerateRoutineResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadRoutine(Guid routineId)
    {
        var userId = User.GetUserId();
        var result = await _workoutService.DownloadRoutineAsync(userId, routineId);

        if (!result.IsSuccess)
            return NotFound(new { error = result.ErrorMessage });

        return Ok(result.Data);
    }

    // ── USAGE STATS ──────────────────────────────────────────────────────

    /// <summary>
    /// Get the current user's AI usage stats (remaining prompts, timer info).
    /// </summary>
    [HttpGet("usage")]
    [ProducesResponseType(typeof(AiUsageDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsage()
    {
        var userId = User.GetUserId();
        var result = await _chatService.GetUsageAsync(userId);

        return Ok(result.Data);
    }
}
