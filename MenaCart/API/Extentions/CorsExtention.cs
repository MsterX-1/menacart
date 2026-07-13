using Microsoft.Extensions.DependencyInjection;

namespace API.Extensions
{
    public static class CorsExtensions
    {
        public static IServiceCollection AddCorsConfig(this IServiceCollection services)
        {
            services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                {
                    policy.WithOrigins(
                            "http://menacart-ll2s-xi.vercel.app",
                            "https://menacart-ll2s-xi.vercel.app"
                        )
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials();
                });
            });

            return services;
        }
    }
}