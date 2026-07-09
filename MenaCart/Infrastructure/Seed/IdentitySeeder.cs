using Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Seed
{
    public static class IdentitySeeder
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<User>>();
            var config = serviceProvider.GetRequiredService<IConfiguration>();


            // SEED ROLES
            string[] roles = { "Admin", "Seller","Customer" };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            // ADMIN FROM CONFIG
            var adminSection = config.GetSection("AdminUser");

            var adminEmail = adminSection["Email"];
            var adminUserName = adminSection["UserName"];
            var adminPassword = adminSection["Password"];

            var adminUser = await userManager.FindByEmailAsync(adminEmail);

            if (adminUser == null)
            {
                var user = new User
                {
                    UserName = adminUserName,
                    Email = adminEmail,
                    EmailConfirmed = true,
                    FirstName = "Admin",
                    LastName = "Admin"
                };

                var result = await userManager.CreateAsync(user, adminPassword);

                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "Admin");
                }
            }
        }
    }
}