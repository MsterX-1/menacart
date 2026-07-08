using Application.Interfaces.IRepositories;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Application.Services;
using Infrastructure.Repository;
using Infrastructure.Repositories;
using Infrastructure.UnitOfWork;
using Infrastructure.Services;
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
            services.AddScoped(typeof(IGenaricRepository<>), typeof(GenaricRepository<>));
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
            services.AddScoped<IReturnRepository, ReturnRepository>();
            services.AddScoped<ICategoryRepository, CategoryRepository>();
            services.AddScoped<ISellerDocumentRepository, SellerDocumentRepository>();
            services.AddScoped<IReviewRepository, ReviewRepository>();
            services.AddScoped<ISellerReviewRepository, SellerReviewRepository>();
            services.AddScoped<ISellerCommissionRepository, SellerCommissionRepository>();
            services.AddScoped<ISellerPayoutRepository, SellerPayoutRepository>();
            services.AddScoped<ILoyaltyPointRepository, LoyaltyPointRepository>();
            services.AddScoped<IWishlistRepository, WishlistRepository>();
            services.AddScoped<INotificationRepository, NotificationRepository>();


            // Services
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IOrderService, OrderService>();
            services.AddScoped<IProductService, ProductService>();
            services.AddScoped<IAdminService, AdminService>();
            services.AddScoped<ICartService, CartService>();
            services.AddScoped<IReturnService, ReturnService>();
            services.AddScoped<ICategoryService, CategoryService>();
            services.AddScoped<ISellerOnboardingService, SellerOnboardingService>();
            services.AddScoped<ISellerDocumentService, SellerDocumentService>();
            services.AddScoped<IShippingService, ShippingService>();
            services.AddScoped<IPaymentGatewayService, StripePaymentGatewayService>();
            services.AddScoped<IReviewService, ReviewService>();
            services.AddScoped<IPayoutService, PayoutService>();
            services.AddScoped<ILoyaltyService, LoyaltyService>();
            services.AddScoped<ICouponService, CouponService>();
            services.AddScoped<IAddressService, AddressService>();
            services.AddScoped<IWishlistService, WishlistService>();
            services.AddScoped<INotificationService, NotificationService>();
            services.AddScoped<ISellerDashboardService, SellerDashboardService>();


            return services;
        }
    }
}