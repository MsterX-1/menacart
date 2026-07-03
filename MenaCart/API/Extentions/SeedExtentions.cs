using Infrastructure.Seed;

namespace API.Extentions
{
    public static class SeedExtensions
    {
        public static async Task UseIdentitySeeder(this WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            await IdentitySeeder.SeedAsync(scope.ServiceProvider);
        }
    }
}
