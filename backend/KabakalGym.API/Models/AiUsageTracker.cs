using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KabakalGym.API.Models;

/// <summary>
/// Tracks per-user AI usage for tier-based rate limiting.
/// Chat prompts use a 30-minute sliding window.
/// Routine generation uses a 7-day sliding window.
/// </summary>
public class AiUsageTracker
{
    [Key]
    public Guid UserId { get; set; }

    // ── Chat Prompt Tracking (sliding 30-min window) ──────────────────────
    public int ChatPromptsUsed { get; set; } = 0;
    public DateTime ChatWindowStart { get; set; } = DateTime.UtcNow;

    // ── Routine Generation Tracking (sliding 7-day window) ────────────────
    public int RoutinesGeneratedThisWeek { get; set; } = 0;
    public DateTime RoutineWeekStart { get; set; } = DateTime.UtcNow;

    // ── Navigation ────────────────────────────────────────────────────────
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}
