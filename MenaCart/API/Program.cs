using API.Extensions;
using API.Extentions;

namespace API
{
    public class Program
    {
        public async static Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddDatabase(builder.Configuration);
            builder.Services.AddApplicationServices();
            builder.Services.AddIdentityConfig();
            builder.Services.AddAuthenticationConfig(builder.Configuration);
            builder.Services.AddSwaggerConfig();
            builder.Services.AddCorsConfig();
            builder.Services.AddOutputCache();

            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
                });

            builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
            {
                options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
            });

            var app = builder.Build();

            // SEED DATABASE (ROLES + ADMIN)
            await app.UseIdentitySeeder();

            app.UseSwagger();
            app.UseSwaggerUI(options =>
            {
                options.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
                options.RoutePrefix = string.Empty; // Serves Swagger directly at https://menacart.runasp.net/
            });

            // Middleware
            app.UseHttpsRedirection();
            app.UseStaticFiles();

            app.UseCors("AllowFrontend"); // Use the frontend-specific policy
            
            app.UseOutputCache();

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
