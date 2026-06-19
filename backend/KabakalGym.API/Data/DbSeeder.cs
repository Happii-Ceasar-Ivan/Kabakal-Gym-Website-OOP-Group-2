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
}
