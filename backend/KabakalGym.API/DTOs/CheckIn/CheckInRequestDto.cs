using System.ComponentModel.DataAnnotations;

namespace KabakalGym.API.DTOs.CheckIn;

public class CheckInRequestDto
{
    [Required]
    public string QrPayload { get; set; } = string.Empty;

    [Required]
    [Range(-90.0, 90.0)]
    public double Latitude { get; set; }

    [Required]
    [Range(-180.0, 180.0)]
    public double Longitude { get; set; }
}
