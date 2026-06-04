// ─────────────────────────────────────────────────────────────────────────────
// SPRINT 3 PATCH — Program.cs
//
// Add the two service registrations below to your existing Program.cs.
// Place them alongside your Sprint 2 IAuthService registration.
//
// No new NuGet packages required — all Sprint 3 code uses existing dependencies.
// ─────────────────────────────────────────────────────────────────────────────

// ── BLOCK 1: SERVICE REGISTRATIONS ────────────────────────────────────────
// Add alongside your existing Sprint 2 registrations:

builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<ITransactionService,  TransactionService>();

// ── BLOCK 2: NEW USING DIRECTIVES ─────────────────────────────────────────
// Add at the top of Program.cs if not already present:

using KabakalGym.API.Services.Interfaces;   // already present from Sprint 2

// ─────────────────────────────────────────────────────────────────────────────
// NO MIGRATION REQUIRED FOR SPRINT 3
//
// Sprint 3 adds zero new entity fields — it only adds service and controller
// layers on top of the schema that already exists in the database.
//
// If you added IsActive, FirstName, LastName in Sprint 2 migrations, those
// are already live. Sprint 3 is purely application-layer work.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SWAGGER TEST SEQUENCE (after applying patch and running the project):
//
// 1. POST /api/auth/register   → get JWT
// 2. Click "Authorize" → paste "Bearer <token>"
// 3. GET /api/subscription/me  → verify Unpaid subscription returned
//
// Admin flow (requires an Admin-role user):
// 4. Manually update a user's Role to "Admin" in Neon.tech console OR
//    create a seed admin in DbSeeder (Sprint 4 admin seeding task)
// 5. POST /api/auth/login      → get Admin JWT
// 6. Click "Authorize" → paste Admin Bearer token
// 7. GET /api/subscription/members        → paginated member list
// 8. POST /api/transaction  { UserId, AmountPaid: 699, PaymentMethod: "Cash", PlanType: "Monthly" }
//                                         → 201 + Transaction record
// 9. GET /api/subscription/me (as member) → PaymentStatus: "Paid", ExpirationDate: +30 days
// ─────────────────────────────────────────────────────────────────────────────
