using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.User;

public sealed record UpdateProfileSettingsDto(
    [MaxLength(500)] string? ProfilePictureUrl,
    [MaxLength(500)] string? BackgroundPictureUrl,
    [MaxLength(200)] string? Bio
);
