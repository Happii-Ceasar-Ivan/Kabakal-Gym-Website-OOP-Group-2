namespace KabakalGym.API.Services.Interfaces;

public interface IPaymentGatewayService
{
    Task<string> CreateInvoiceAsync(Guid userId, string email, decimal amount, string planType);
    Task ProcessWebhookAsync(string invoiceId, string status, string externalId);
}
