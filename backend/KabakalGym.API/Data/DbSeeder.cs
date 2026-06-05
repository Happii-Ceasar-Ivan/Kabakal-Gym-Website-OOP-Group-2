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
                IsVerified = true // Admins bypass the waiting room
            };

            adminUser.PasswordHash = hasher.HashPassword(adminUser, "KabakalAkoBro123!");

            context.Users.Add(adminUser);
            await context.SaveChangesAsync();
        }
    }
}
