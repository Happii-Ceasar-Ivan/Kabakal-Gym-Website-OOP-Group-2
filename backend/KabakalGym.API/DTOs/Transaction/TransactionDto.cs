namespace KabakalGym.API.DTOs.Transaction;

/// <summary>
/// TransactionDto
/// Read response for a single financial ledger entry.
/// Returned by GET /api/transaction/me and GET /api/transaction/{userId}.
///
/// Immutable record — the Transactions table is an append-only ledger.
/// No update or delete endpoints exist for transactions.
/// </summary>
public sealed record TransactionDto(
    Guid     TransactionId,
    Guid     UserId,
    decimal  AmountPaid,

    /// <summary>"Cash" | "GCash" | "Card" | "QR-Code"</summary>
    string   PaymentMethod,

    /// <summary>UTC timestamp of when the payment was recorded.</summary>
    DateTime Timestamp
);
