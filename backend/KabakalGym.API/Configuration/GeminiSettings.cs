namespace KabakalGym.API.Configuration;

/// <summary>
/// Strongly-typed Gemini API configuration.
/// Local dev: stored in dotnet user-secrets.
/// Production: set via Azure App Service env vars (GEMINI__APIKEY, etc.).
/// </summary>
public class GeminiSettings
{
    public const string SectionName = "Gemini";

    /// <summary>
    /// Gemini API key — NEVER commit this to source control.
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Model to use (e.g., "gemini-3.5-flash").
    /// </summary>
    public string Model { get; set; } = "gemini-2.5-flash";

    /// <summary>
    /// Maximum tokens in the AI response — caps cost and prevents oversized responses.
    /// </summary>
    public int MaxOutputTokens { get; set; } = 4096;
}
