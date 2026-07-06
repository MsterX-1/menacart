using Application.Interfaces.IRepositories;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Application.Services;
using Infrastructure.Repository;
using Infrastructure.UnitOfWork;
using Microsoft.Extensions.DependencyInjection;

namespace API.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            // Unit of Work
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // Repositories
            services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
            services.AddScoped<IOrderRepository, OrderRepository>();
            services.AddScoped<ISubOrderRepository, SubOrderRepository>();
            services.AddScoped<ICartRepository, CartRepository>();
            services.AddScoped<IAddressRepository, AddressRepository>();
            services.AddScoped<ICouponRepository, CouponRepository>();
           
            services.AddScoped<IShippingRepository, ShippingRepository>();
            services.AddScoped<ISellerRepository, SellerRepository>();
            services.AddScoped<IProductRepository, ProductRepository>();
            services.AddScoped<IProductVariantRepository, ProductVariantRepository>();


            // Services
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IOrderService, OrderService>();
            services.AddScoped<IProductService, ProductService>();


            return services;
        }
    }
}