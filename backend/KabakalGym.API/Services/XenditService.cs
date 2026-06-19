using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using KabakalGym.API.Configuration;
using KabakalGym.API.Data;
using KabakalGym.API.Models;
using KabakalGym.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace KabakalGym.API.Services;

public class XenditService : IPaymentGatewayService
{
    private readonly HttpClient _httpClient;
    private readonly KabakalDbContext _context;
    private readonly XenditSettings _settings;
    private readonly ILogger<XenditService> _logger;

    public XenditService(
        HttpClient httpClient, 
        KabakalDbContext context, 
        IOptions<XenditSettings> options,
        ILogger<XenditService> logger)
    {
        _httpClient = httpClient;
        _context = context;
        _settings = options.Value;
        _logger = logger;

        // Configure basic auth for Xendit
        var authString = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_settings.SecretKey}:"));
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authString);
        _httpClient.BaseAddress = new Uri("https://api.xendit.co/");
    }

    public async Task<string> CreateInvoiceAsync(Guid userId, string email, decimal amount, string planType)
    {
        // 1. We create a pending transaction in our ledger BEFORE calling Xendit.
        // This ensures we have a local record of the intent to pay.
        var externalId = $"INV-{userId}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
        
        var pendingTransaction = new Transaction
        {
            TransactionId = Guid.NewGuid(),
            UserId = userId,
            AmountPaid = amount,
            PaymentMethod = "Xendit-Online",
            Status = "Pending",
            ExternalInvoiceId = externalId,
            // Timestamp defaults to NOW() via Postgres
        };

        _context.Transactions.Add(pendingTransaction);
        await _context.SaveChangesAsync();

        // 2. Call Xendit to generate the checkout UI url
        var payload = new
        {
            external_id = externalId,
            amount = amount,
            payer_email = email,
            description = $"Kabakal Gym Subscription - {planType}",
            success_redirect_url = "https://kabakal-gym-website-oop-group-2.vercel.app/member/billing?success=true",
            failure_redirect_url = "https://kabakal-gym-website-oop-group-2.vercel.app/member/billing?success=false",
            currency = "PHP"
        };

        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync("v2/invoices", content);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("Xendit API Error: {Error}", error);
            throw new Exception($"Failed to generate Xendit checkout invoice. Reason: {error}");
        }

        var responseData = await response.Content.ReadFromJsonAsync<JsonElement>();
        var invoiceUrl = responseData.GetProperty("invoice_url").GetString();

        return invoiceUrl ?? throw new Exception("Invoice URL was missing from Xendit response.");
    }

    public async Task ProcessWebhookAsync(string invoiceId, string status, string externalId)
    {
        // Guard: We only care if the invoice was actually paid
        if (status.ToUpper() != "PAID" && status.ToUpper() != "SETTLED")
        {
            return;
        }

        // Fetch our pending transaction
        var transaction = await _context.Transactions
            .Include(t => t.User)
            .ThenInclude(u => u.Subscription)
            .FirstOrDefaultAsync(t => t.ExternalInvoiceId == externalId);

        if (transaction == null)
        {
            _logger.LogWarning("Webhook received for unknown ExternalId: {ExternalId}", externalId);
            return;
        }

        // IDEMPOTENCY CHECK
        // If the transaction is already "Paid", we safely ignore this webhook.
        // This prevents double-crediting the user if Xendit retries the webhook, or if the user double-clicked.
        if (transaction.Status == "Paid")
        {
            _logger.LogInformation("Webhook received for already paid invoice: {InvoiceId}. Ignoring.", invoiceId);
            return;
        }

        // Update the transaction status
        transaction.Status = "Paid";

        // Extend the user's subscription mathematically (stacking days)
        var sub = transaction.User?.Subscription;
        if (sub != null)
        {
            var today = DateTime.UtcNow;
            var currentExpiry = sub.ExpirationDate.HasValue && sub.ExpirationDate.Value > today 
                                ? sub.ExpirationDate.Value 
                                : today;
            
            sub.ExpirationDate = currentExpiry.AddDays(30); // Monthly payment logic
            sub.PaymentStatus = "Paid";
        }

        // ATOMIC COMMIT: The transaction status AND the subscription update are saved together.
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Successfully processed Xendit payment for User {UserId}", transaction.UserId);
    }
}
