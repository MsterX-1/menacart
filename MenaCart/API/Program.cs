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

            // Enable Swagger only in development
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.ConfigObject.PersistAuthorization = true;
                });
            }

            // Middleware
            app.UseHttpsRedirection();

            app.UseCors("AllowFrontend"); // Use the frontend-specific policy

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
