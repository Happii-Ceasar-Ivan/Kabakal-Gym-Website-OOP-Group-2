namespace KabakalGym.API.Models;

/// <summary>
/// PlanTypes
/// Defines the subscription duration tiers offered by Kabakal Gym.
///
/// SCHEMA NOTE: PlanType is intentionally NOT a column on the Transactions entity.
/// The SRS data dictionary for Transactions only specifies: TransactionId, UserId,
/// AmountPaid, PaymentMethod, Timestamp. PlanType lives exclusively on
/// RecordTransactionDto (the incoming request). TransactionService converts it to
/// an ExpirationDate offset and writes that to the Subscriptions table.
///
/// This keeps the financial ledger clean — a Transaction is an immutable record
/// of money received, not a subscription directive.
/// </summary>
public static class PlanTypes
{
    public const string Day     = "Day";
    public const string Monthly = "Monthly";
    public const string Annual  = "Annual";

    private static readonly HashSet<string> _valid = [Day, Monthly, Annual];

    /// <summary>Returns true if the given value is a recognized plan type.</summary>
    public static bool IsValid(string planType) => _valid.Contains(planType);

    /// <summary>
    /// Returns the number of calendar days the given plan type covers.
    /// Used by TransactionService to calculate the new ExpirationDate.
    ///
    /// Stacking rule: if the member has an unexpired subscription, the new
    /// days are added ON TOP of the current ExpirationDate, not from today.
    /// </summary>
    public static int GetDays(string planType) => planType switch
    {
        Day     => 1,
        Monthly => 30,
        Annual  => 365,
        _       => throw new ArgumentException($"Unknown plan type: '{planType}'.", nameof(planType))
    };
}
