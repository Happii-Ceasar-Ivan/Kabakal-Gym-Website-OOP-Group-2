using Microsoft.AspNetCore.Identity;
using KabakalGym.API.Models;

namespace KabakalGym.API.Data;

public static class DbSeeder
{
    public static async Task SeedAdminAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<KabakalDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        // Safely pull from Environment Variables or AppSettings (Azure configures these)
        var adminEmail = config["AdminEmail"]?.ToLower();
        var adminPassword = config["AdminPassword"];

        if (!string.IsNullOrEmpty(adminEmail) && !string.IsNullOrEmpty(adminPassword))
        {
            if (!context.Users.Any(u => u.Email == adminEmail))
            {
                var adminUser = new User
                {
                    UserId = Guid.NewGuid(),
                    Email = adminEmail,
                    FirstName = "Jhayar",
                    LastName = "Kabakal",
                    Role = UserRoles.Admin,
                    IsActive = true,
                    IsVerified = true
                };
                adminUser.PasswordHash = hasher.HashPassword(adminUser, adminPassword);
                context.Users.Add(adminUser);
            }
        }

        var kioskEmail = config["KioskEmail"]?.ToLower();
        var kioskPassword = config["KioskPassword"];

        if (!string.IsNullOrEmpty(kioskEmail) && !string.IsNullOrEmpty(kioskPassword))
        {
            if (!context.Users.Any(u => u.Email == kioskEmail))
            {
                var kioskUser = new User
                {
                    UserId = Guid.NewGuid(),
                    Email = kioskEmail,
                    FirstName = "Gate",
                    LastName = "Kiosk",
                    Role = UserRoles.GateKiosk,
                    IsActive = true,
                    IsVerified = true
                };
                kioskUser.PasswordHash = hasher.HashPassword(kioskUser, kioskPassword);
                context.Users.Add(kioskUser);
            }
        }
        var staffEmail = config["StaffEmail"]?.ToLower();
        var staffPassword = config["StaffPassword"];
        
        if (!string.IsNullOrEmpty(staffEmail) && !string.IsNullOrEmpty(staffPassword))
        {
            if (!context.Users.Any(u => u.Email == staffEmail))
            {
                var staffUser = new User
                {
                    UserId = Guid.NewGuid(),
                    Email = staffEmail,
                    FirstName = "Staff",
                    LastName = "Member",
                    Role = UserRoles.Staff,
                    IsActive = true,
                    IsVerified = true
                };
                staffUser.PasswordHash = hasher.HashPassword(staffUser, staffPassword);
                context.Users.Add(staffUser);
            }
        }

        await context.SaveChangesAsync();
    }

    public static async Task SeedDummyAnalyticsDataAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<KabakalDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();

        // Create a dummy user if it doesn't exist to own the data
        var dummyEmail = "dummy_analytics@kabakalgym.com";
        var dummyUser = context.Users.FirstOrDefault(u => u.Email == dummyEmail);
        
        if (dummyUser == null)
        {
            dummyUser = new User
            {
                UserId = Guid.NewGuid(),
                Email = dummyEmail,
                FirstName = "Dummy",
                LastName = "Data",
                Role = UserRoles.Member,
                IsActive = true,
                IsVerified = true,
                PasswordHash = "dummy_hash", // Doesn't matter, won't log in
                Subscription = new Subscription
                {
                    PaymentStatus = PaymentStatuses.Paid,
                    ExpirationDate = DateTime.UtcNow.AddDays(20)
                }
            };
            context.Users.Add(dummyUser);
            await context.SaveChangesAsync();
        }

        // Check if we already have dummy data (prevent duplicate seeding)
        bool hasDummyData = context.Transactions.Any(t => t.UserId == dummyUser.UserId);
        if (hasDummyData) return;

        var random = new Random();
        var now = DateTime.UtcNow;
        var transactions = new List<Transaction>();
        var visits = new List<Visit>();

        // Generate data for the past 4 months (to ensure we have fully completed 3 months to export)
        for (int i = 0; i < 120; i++)
        {
            var date = now.AddDays(-i);
            
            // Generate 1-5 transactions per day
            int dailyTransactions = random.Next(1, 6);
            for (int t = 0; t < dailyTransactions; t++)
            {
                transactions.Add(new Transaction
                {
                    UserId = dummyUser.UserId,
                    AmountPaid = random.Next(1, 4) == 1 ? 50.00m : 1500.00m, // Mix of day passes and subscriptions
                    PaymentMethod = "Cash",
                    Status = "Paid",
                    Timestamp = date.AddHours(random.Next(6, 22)).AddMinutes(random.Next(0, 60)) // Random time between 6 AM and 10 PM
                });
            }

            // Generate 5-20 visits per day
            int dailyVisits = random.Next(5, 21);
            for (int v = 0; v < dailyVisits; v++)
            {
                var checkInTime = date.AddHours(random.Next(6, 21)).AddMinutes(random.Next(0, 60));
                visits.Add(new Visit
                {
                    UserId = dummyUser.UserId,
                    CheckIn = checkInTime,
                    CheckOut = checkInTime.AddHours(random.Next(1, 3)),
                    IsApproved = true
                });
            }
        }

        context.Transactions.AddRange(transactions);
        context.Visits.AddRange(visits);
        await context.SaveChangesAsync();
    }
}
