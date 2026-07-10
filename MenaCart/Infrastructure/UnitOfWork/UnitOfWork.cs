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
    }
}