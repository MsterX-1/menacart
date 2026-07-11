using System.Threading.Tasks;
using Application.Interfaces.IRepositories;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore.Storage;

namespace Infrastructure.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;
        private IDbContextTransaction? _currentTransaction;

        // Public properties for custom repositories
        public IRefreshTokenRepository RefreshTokenRepository { get; }
        public IOrderRepository OrderRepository { get; }
        public ISubOrderRepository SubOrderRepository { get; }
        public ICartRepository CartRepository { get; }
        public ICouponRepository CouponRepository { get; }
        public IAddressRepository AddressRepository { get; }
        public ISellerRepository SellerRepository { get; }
        public IShippingRepository ShippingRepository { get; }
        public ISellerShippingRuleRepository SellerShippingRuleRepository { get; }
        public IWishlistRepository WishlistRepository { get; }
        public IProductRepository ProductRepository { get; }
        public IProductVariantRepository ProductVariantRepository { get; }
        public IReturnRepository ReturnRepository { get; }
        public ICategoryRepository CategoryRepository { get; }
        public ISellerDocumentRepository SellerDocumentRepository { get; }
        public IReviewRepository ReviewRepository { get; }
        public ISellerReviewRepository SellerReviewRepository { get; }
        public ISellerCommissionRepository SellerCommissionRepository { get; }
        public ISellerPayoutRepository SellerPayoutRepository { get; }
        public ILoyaltyPointRepository LoyaltyPointRepository { get; }

        // Generic repositories
        public IGenaricRepository<OrderItem> OrderItemRepository { get; }
        public INotificationRepository NotificationRepository { get; }
        public IGenaricRepository<Payment> PaymentRepository { get; }
 
        public UnitOfWork(
            AppDbContext context,
            IRefreshTokenRepository refreshTokenRepository,
            IOrderRepository orderRepository,
            ISubOrderRepository subOrderRepository,
            ICartRepository cartRepository,
            ICouponRepository couponRepository,
            IAddressRepository addressRepository,
            ISellerRepository sellerRepository,
            IShippingRepository shippingRepository,
            ISellerShippingRuleRepository sellerShippingRuleRepository,
            IWishlistRepository wishlistRepository,
            IProductRepository productRepository,
            IProductVariantRepository productVariantRepository,
            IReturnRepository returnRepository,
            ICategoryRepository categoryRepository,
            ISellerDocumentRepository sellerDocumentRepository,
            IReviewRepository reviewRepository,
            ISellerReviewRepository sellerReviewRepository,
            ISellerCommissionRepository sellerCommissionRepository,
            ISellerPayoutRepository sellerPayoutRepository,
            ILoyaltyPointRepository loyaltyPointRepository,
            IGenaricRepository<OrderItem> orderItemRepository,
            INotificationRepository notificationRepository,
            IGenaricRepository<Payment> paymentRepository)
        {
            _context = context;
            RefreshTokenRepository = refreshTokenRepository;
            OrderRepository = orderRepository;
            SubOrderRepository = subOrderRepository;
            CartRepository = cartRepository;
            CouponRepository = couponRepository;
            AddressRepository = addressRepository;
            SellerRepository = sellerRepository;
            WishlistRepository = wishlistRepository;
            ShippingRepository = shippingRepository;
            SellerShippingRuleRepository = sellerShippingRuleRepository;
            ProductRepository = productRepository;
            ProductVariantRepository = productVariantRepository;
            ReturnRepository = returnRepository;
            CategoryRepository = categoryRepository;
            SellerDocumentRepository = sellerDocumentRepository;
            ReviewRepository = reviewRepository;
            SellerReviewRepository = sellerReviewRepository;
            SellerCommissionRepository = sellerCommissionRepository;
            SellerPayoutRepository = sellerPayoutRepository;
            LoyaltyPointRepository = loyaltyPointRepository;
 
            OrderItemRepository = orderItemRepository;
            NotificationRepository = notificationRepository;
            PaymentRepository = paymentRepository;
        }

        public async Task<int> CompleteAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task BeginTransactionAsync()
        {
            if (_currentTransaction == null)
            {
                _currentTransaction = await _context.Database.BeginTransactionAsync();
            }
        }

        public async Task CommitTransactionAsync()
        {
            if (_currentTransaction != null)
            {
                await _currentTransaction.CommitAsync();
                await _currentTransaction.DisposeAsync();
                _currentTransaction = null;
            }
        }

        public async Task RollbackTransactionAsync()
        {
            try
            {
                if (_currentTransaction != null)
                {
                    await _currentTransaction.RollbackAsync();
                    await _currentTransaction.DisposeAsync();
                    _currentTransaction = null;
                }
            }
            catch
            {
                // Suppress exception if transaction is already invalid/disposed
            }
        }

        public async System.Threading.Tasks.Task ClearUserDataAsync(string userId)
        {
            var carts = System.Linq.Queryable.Where(_context.Carts, c => c.UserId == userId);
            _context.Carts.RemoveRange(carts);
            
            var addresses = System.Linq.Queryable.Where(_context.Addresses, a => a.UserId == userId);
            _context.Addresses.RemoveRange(addresses);
            
            var wishlists = System.Linq.Queryable.Where(_context.Wishlists, w => w.UserId == userId);
            _context.Wishlists.RemoveRange(wishlists);
            
            var tokens = System.Linq.Queryable.Where(_context.RefreshTokens, t => t.UserId == userId);
            _context.RefreshTokens.RemoveRange(tokens);
            
            var notifs = System.Linq.Queryable.Where(_context.Notifications, n => n.UserId == userId);
            _context.Notifications.RemoveRange(notifs);

            var usages = System.Linq.Queryable.Where(_context.UserCouponUsages, u => u.UserId == userId);
            _context.UserCouponUsages.RemoveRange(usages);

            var sellerProfile = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(_context.SellerProfiles, s => s.UserId == userId);
            if (sellerProfile != null)
            {
                var docs = System.Linq.Queryable.Where(_context.SellerDocuments, d => d.SellerId == sellerProfile.SellerId);
                _context.SellerDocuments.RemoveRange(docs);
                
                var banks = System.Linq.Queryable.Where(_context.SellerBankInfos, b => b.SellerId == sellerProfile.SellerId);
                _context.SellerBankInfos.RemoveRange(banks);
                
                _context.SellerProfiles.Remove(sellerProfile);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<bool> HasOrdersOrProductsAsync(string userId)
        {
            var hasOrders = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AnyAsync(_context.Orders, o => o.UserId == userId);
            var sellerProfile = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(_context.SellerProfiles, s => s.UserId == userId);
            var hasProducts = false;
            if (sellerProfile != null)
            {
                 hasProducts = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AnyAsync(_context.Products, p => p.SellerId == sellerProfile.SellerId);
            }
            return hasOrders || hasProducts;
        }
    }
}