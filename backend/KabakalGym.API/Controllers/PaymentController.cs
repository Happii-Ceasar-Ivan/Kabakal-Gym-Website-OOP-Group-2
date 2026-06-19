using KabakalGym.API.Data;
using Microsoft.EntityFrameworkCore;
using KabakalGym.API.Configuration;
using KabakalGym.API.Models;
using KabakalGym.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Json;

namespace KabakalGym.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentGatewayService _paymentGateway;
    private readonly KabakalDbContext _context;
    private readonly XenditSettings _settings;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(
        IPaymentGatewayService paymentGateway, 
        KabakalDbContext context,
        IOptions<XenditSettings> options,
        ILogger<PaymentController> logger)
    {
        _paymentGateway = paymentGateway;
        _context = context;
        _settings = options.Value;
        _logger = logger;
    }

    [HttpPost("checkout")]
    [Authorize(Roles = UserRoles.Member)]
    public async Task<IActionResult> Checkout()
    {
        // Extract the user's ID and Email directly from their secure JWT token
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? "member@kabakalgym.com";

        if (!Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized("Invalid user token.");
        }

        try
        {
            // Monthly payment is fixed at 699 PHP for this example
            var invoiceUrl = await _paymentGateway.CreateInvoiceAsync(userId, userEmail, 699m, "Monthly Plan");
            return Ok(new { url = invoiceUrl });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create checkout.");
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpPost("webhook")]
    [AllowAnonymous] // Webhooks come from Xendit, not logged-in users
    public async Task<IActionResult> Webhook([FromBody] JsonElement payload)
    {
        // 1. SECURITY CHECK: Verify the Webhook came from Xendit, not an attacker.
        if (!Request.Headers.TryGetValue("x-callback-token", out var callbackToken) || 
            callbackToken != _settings.WebhookVerificationToken)
        {
            _logger.LogWarning("Webhook rejected: Invalid or missing x-callback-token.");
            return Unauthorized("Invalid Webhook Token.");
        }

        try
        {
            // 2. Extract necessary fields from Xendit's JSON payload safely
            string invoiceId = null;
            string externalId = null;
            string status = null;

            if (payload.TryGetProperty("id", out var idProp)) invoiceId = idProp.GetString();
            if (payload.TryGetProperty("external_id", out var extIdProp)) externalId = extIdProp.GetString();
            if (payload.TryGetProperty("status", out var statusProp)) status = statusProp.GetString();

            if (string.IsNullOrEmpty(invoiceId) || string.IsNullOrEmpty(externalId) || string.IsNullOrEmpty(status))
            {
                _logger.LogWarning("Webhook missing required fields. Payload: {Payload}", payload.ToString());
                return BadRequest("Malformed webhook payload.");
            }

            // 3. Process it via our Idempotent service
            await _paymentGateway.ProcessWebhookAsync(invoiceId, status, externalId);

            // 4. Return 200 OK so Xendit knows we received it successfully
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process webhook.");
            // Returning 500 tells Xendit to retry sending the webhook later
            return StatusCode(500, "Internal error processing webhook.");
        }
    }


}
