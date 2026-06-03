namespace KabakalGym.API.Services.Interfaces;

/// <summary>
/// Abstraction for email delivery.
/// Currently implemented by ResendEmailService.
/// Swappable to SendGrid, Mailgun, etc. without touching AuthService.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Sends a password reset email containing a clickable link.
    /// </summary>
    /// <param name="toEmail">Recipient email address.</param>
    /// <param name="resetLink">Full URL the user clicks to reset their password.</param>
    Task SendPasswordResetEmailAsync(string toEmail, string resetLink);
}
