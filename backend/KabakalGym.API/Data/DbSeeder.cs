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

        var adminEmail = "KabakalJhayar@admin.com".ToLower();

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
            adminUser.PasswordHash = hasher.HashPassword(adminUser, "KabakalAkoBro123!");
            context.Users.Add(adminUser);
        }

        var kioskEmail = "kiosk@kabakalgym.com";
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
            kioskUser.PasswordHash = hasher.HashPassword(kioskUser, "KabakalKiosk123!");
            context.Users.Add(kioskUser);
        }

        var staffEmail = "staff@kabakalgym.com";
        if (!context.Users.Any(u => u.Email == staffEmail))
        {
            var staffUser = new User
            {
                UserId = Guid.NewGuid(),
                Email = staffEmail,
                FirstName = "Front",
                LastName = "Desk",
                Role = UserRoles.Staff,
                IsActive = true,
                IsVerified = true
            };
            staffUser.PasswordHash = hasher.HashPassword(staffUser, "KabakalStaff123!");
            context.Users.Add(staffUser);
        }

        await context.SaveChangesAsync();
    }
}
