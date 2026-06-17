namespace KabakalGym.API.Configuration;

/// <summary>
/// Strongly-typed settings for Cloudinary signed uploads.
/// Bound from configuration section "Cloudinary".
/// </summary>
public class CloudinarySettings
{
    public const string SectionName = "Cloudinary";

    /// <summary>
    /// Your Cloudinary cloud name (e.g., "dxyz123ab").
    /// </summary>
    public string CloudName { get; set; } = string.Empty;

    /// <summary>
    /// Public API key — safe to expose to the frontend.
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Secret key — NEVER sent to the frontend. Used only for signature generation.
    /// </summary>
    public string ApiSecret { get; set; } = string.Empty;
}
