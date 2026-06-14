using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.Ai;

public class ChatRequestDto
{
    /// <summary>
    /// The user's chat message. Hard-capped at 500 chars to prevent prompt flooding.
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;
}
