# Membership Subscription Update Fix Guide

## 1. Do You Need to Click "Resend" in Xendit Every Time?
**No!** Once you deploy this fix, **all future purchases will update automatically** within 1–2 seconds of payment without you ever touching the Xendit dashboard.

* **Why did I mention the "Resend" button?** Only for the *past* test transaction (`INV-86e71cc1-...`) that you already paid for earlier today while the bug was still on the server.
* **For all new payments:** As soon as a member pays on the Xendit checkout page, Xendit automatically calls your `/api/payment/webhook` endpoint in the background. With `.AsTracking()` added below, your database will automatically update `Transactions.Status` to `"Paid"` and `Subscriptions.PaymentStatus` to `"Paid"` (+30 days).

*(Note: I also included a tiny frontend improvement in **Step 4** below so that when the user clicks **"BACK TO DASHBOARD"** on the receipt screen, it clears `?success=true` and immediately shows their new **ACTIVE (30 DAYS)** status without needing a manual refresh).*

---

## 2. Root Cause Summary
In `backend/KabakalGym.API/Program.cs` (line 40), the `KabakalDbContext` is configured with global No-Tracking:
```csharp
.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTrackingWithIdentityResolution)
```
Because of this setting, EF Core does not track changes to entities fetched from the database unless `.AsTracking()` is explicitly called on the query. 

In `XenditService.cs`, `TransactionService.cs`, and `SubscriptionService.cs`, the queries that fetched the user's `Transaction` and `Subscription` rows were missing `.AsTracking()`. When `await _context.SaveChangesAsync()` was called, EF Core thought nothing had changed, executed **zero SQL `UPDATE` statements**, and returned `200 OK`.

---

## 3. Backend Fixes

### Step 1: Fix `backend/KabakalGym.API/Services/XenditService.cs`
Update `ProcessWebhookAsync` (around line 77) to include `.AsTracking()` on the query so EF Core saves the updated `Transaction` and `Subscription` to Neon PostgreSQL:

```csharp
    public async Task ProcessWebhookAsync(string invoiceId, string status, string externalId)
    {
        // Guard: We only care if the invoice was actually paid
        if (status.ToUpper() != "PAID" && status.ToUpper() != "SETTLED")
        {
            return;
        }

        // 1. CRITICAL FIX: Add .AsTracking() because global NoTracking is enabled in Program.cs
        var transaction = await _context.Transactions
            .AsTracking()
            .Include(t => t.User)
            .ThenInclude(u => u.Subscription)
            .FirstOrDefaultAsync(t => t.ExternalInvoiceId == externalId);

        if (transaction == null)
        {
            _logger.LogWarning("Webhook received for unknown ExternalId: {ExternalId}", externalId);
            return;
        }

        // IDEMPOTENCY CHECK
        // Only ignore if BOTH the transaction and the subscription are Paid.
        if (transaction.Status == "Paid" && transaction.User?.Subscription?.PaymentStatus == "Paid")
        {
            _logger.LogInformation("Webhook received for already fully processed invoice: {InvoiceId}. Ignoring.", invoiceId);
            return;
        }

        // Update the transaction status
        transaction.Status = "Paid";

        // Extend or Create the user's subscription mathematically (stacking days)
        var user = transaction.User;
        if (user != null)
        {
            if (user.Subscription == null)
            {
                var newSub = new Subscription
                {
                    UserId = user.UserId,
                    PaymentStatus = PaymentStatuses.Paid,
                    ExpirationDate = DateTime.UtcNow.AddDays(30)
                };
                
                _context.Subscriptions.Add(newSub);
            }
            else
            {
                var today = DateTime.UtcNow;
                var currentExpiry = user.Subscription.ExpirationDate.HasValue && user.Subscription.ExpirationDate.Value > today 
                                    ? user.Subscription.ExpirationDate.Value 
                                    : today;
                
                user.Subscription.ExpirationDate = currentExpiry.AddDays(30);
                user.Subscription.PaymentStatus = PaymentStatuses.Paid;
            }
        }

        // ATOMIC COMMIT: The transaction status AND the subscription update are saved together.
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Successfully processed Xendit payment for User {UserId}", transaction.UserId);
    }
```

---

### Step 2: Fix `backend/KabakalGym.API/Services/TransactionService.cs`
In `RecordPaymentAsync` (around line 102), add `.AsTracking()` so Admin manual payment recording also updates the database properly:

```csharp
        // 2. Load the target user + their subscription (tracked — we will UPDATE subscription)
        var user = await _context.Users
            .AsTracking() // <-- ADD THIS
            .Include(u => u.Subscription)
            .FirstOrDefaultAsync(u => u.UserId == dto.UserId);
```

---

### Step 3: Fix `backend/KabakalGym.API/Services/SubscriptionService.cs`
In `UpdateSubscriptionAsync` (around line 145), add `.AsTracking()` so Admin manual subscription overrides also save properly:

```csharp
        // Re-query with tracking so EF can issue an UPDATE
        var subscription = await _context.Subscriptions
            .AsTracking() // <-- ADD THIS
            .FirstOrDefaultAsync(s => s.UserId == userId);
```

---

## 4. Frontend Polish (Automatic Refresh After Redirect)

When Xendit redirects the user back to `/member/billing?success=true`, Xendit's webhook sometimes takes 1–3 seconds to finish in the background. 

In **`frontend/src/pages/member/MemberBillingPage.jsx`**, update the `useEffect` (lines 14–26) so that if the user just returned from Xendit (`isSuccess === true`), it re-fetches their profile after a short delay to guarantee the updated `Paid` status is loaded into state:

```jsx
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMyProfile();
        setProfile(data);

        // If returning from Xendit checkout, poll once more after 2.5s 
        // in case the Xendit webhook took a moment to finish in the background
        if (isSuccess && (data?.paymentStatus !== 'Paid' || data?.isExpired)) {
          setTimeout(async () => {
            try {
              const refreshed = await getMyProfile();
              setProfile(refreshed);
            } catch (e) {
              console.error("Retry profile fetch failed:", e);
            }
          }, 2500);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [isSuccess]);
```