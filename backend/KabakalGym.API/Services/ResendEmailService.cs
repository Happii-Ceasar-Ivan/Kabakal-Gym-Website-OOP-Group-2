using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using KabakalGym.API.Services.Interfaces;

namespace KabakalGym.API.Services;

/// <summary>
/// Sends emails via the Resend REST API (https://resend.com/docs/api-reference).
/// Uses a typed HttpClient injected via DI — no third-party SDK required.
///
/// NOTE: Until a custom domain is verified on Resend, the free tier only
/// allows sending to the email address used to create the Resend account.
/// The "from" address must be "onboarding@resend.dev".
/// </summary>
public sealed class ResendEmailService : IEmailService
{
    private readonly HttpClient    _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<ResendEmailService> _logger;

    public ResendEmailService(
        HttpClient                    httpClient,
        IConfiguration                config,
        ILogger<ResendEmailService>   logger)
    {
        _httpClient = httpClient;
        _config     = config;
        _logger     = logger;
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink)
    {
        var apiKey = _config["Resend:ApiKey"]
            ?? throw new InvalidOperationException(
                "[FATAL] Resend API key is not configured. " +
                "Set it via: dotnet user-secrets set \"Resend:ApiKey\" \"re_...\""
            );

        var payload = new
        {
            from    = "Kabakal Gym <onboarding@resend.dev>",
            to      = new[] { toEmail },
            subject = "Reset Your Kabakal Gym Password",
            html    = $@"
                <div style='font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem; background: #060407; color: #fff; border-radius: 10px;'>
                    <h2 style='color: #F7F014;'>Password Reset Request</h2>
                    <p>We received a request to reset your Kabakal Gym account password.</p>
                    <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
                    <a href='{resetLink}' style='display: inline-block; margin: 1.5rem 0; padding: 0.8rem 2rem; background: #F7F014; color: #060407; text-decoration: none; border-radius: 8px; font-weight: bold;'>
                        Reset Password
                    </a>
                    <p style='font-size: 0.85rem; opacity: 0.7;'>If you didn't request this, you can safely ignore this email.</p>
                    <hr style='border-color: rgba(255,255,255,0.1); margin: 1.5rem 0;'/>
                    <p style='font-size: 0.75rem; opacity: 0.5;'>&copy; 2026 Kabakal Gym — Digitalizing Local Fitness</p>
                </div>"
        };

        var json = JsonSerializer.Serialize(payload);
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogError("Resend API error {StatusCode}: {Body}", response.StatusCode, body);
            throw new InvalidOperationException($"Failed to send password reset email. Resend returned {response.StatusCode}.");
        }

        _logger.LogInformation("Password reset email sent to {Email}", toEmail);
    }

    public async Task SendVerificationEmailAsync(string toEmail, string otp)
    {
        var apiKey = _config["Resend:ApiKey"]
            ?? throw new InvalidOperationException(
                "[FATAL] Resend API key is not configured. " +
                "Set it via: dotnet user-secrets set \"Resend:ApiKey\" \"re_...\""
            );

        var payload = new
        {
            from    = "Kabakal Gym <onboarding@resend.dev>",
            to      = new[] { toEmail },
            subject = "Verify Your Kabakal Gym Account",
            html    = $@"
                <div style='font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem; background: #060407; color: #fff; border-radius: 10px;'>
                    <h2 style='color: #F7F014;'>Welcome to Kabakal Gym!</h2>
                    <p>We're excited to have you. Please enter the following 6-digit code to verify your email address.</p>
                    <p>This code expires in <strong>15 minutes</strong>.</p>
                    <div style='margin: 1.5rem 0; padding: 1.5rem; background: #1a1a1a; border-radius: 8px; text-align: center;'>
                        <span style='font-size: 2rem; font-weight: bold; letter-spacing: 5px; color: #F7F014;'>{otp}</span>
                    </div>
                    <p style='font-size: 0.85rem; opacity: 0.7;'>If you didn't register at Kabakal Gym, you can safely ignore this email.</p>
                    <hr style='border-color: rgba(255,255,255,0.1); margin: 1.5rem 0;'/>
                    <p style='font-size: 0.75rem; opacity: 0.5;'>&copy; 2026 Kabakal Gym — Digitalizing Local Fitness</p>
                </div>"
        };

        var json = JsonSerializer.Serialize(payload);
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogError("Resend API error {StatusCode}: {Body}", response.StatusCode, body);
            throw new InvalidOperationException($"Failed to send verification email. Resend returned {response.StatusCode}.");
        }

        _logger.LogInformation("Verification email sent to {Email}", toEmail);
    }
}
