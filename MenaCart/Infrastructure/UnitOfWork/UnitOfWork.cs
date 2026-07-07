using System.Threading.Tasks;
using Application.Interfaces.IRepositories;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;

namespace Infrastructure.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;

        // Public properties for custom repositories
        public IRefreshTokenRepository RefreshTokenRepository { get; }
        public IOrderRepository OrderRepository { get; }
        public ISubOrderRepository SubOrderRepository { get; }
        public ICartRepository CartRepository { get; }
        public ICouponRepository CouponRepository { get; }
        public IAddressRepository AddressRepository { get; }
        public ISellerRepository SellerRepository { get; }
        public IShippingRepository ShippingRepository { get; }
        public IProductRepository ProductRepository { get; }
        public IProductVariantRepository ProductVariantRepository { get; }
        public IReturnRepository ReturnRepository { get; }

        // Generic repositories
        public IGenaricRepository<OrderItem> OrderItemRepository { get; }
        public IGenaricRepository<SellerCommission> SellerCommissionRepository { get; }
        public IGenaricRepository<Notification> NotificationRepository { get; }
 
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
            IProductRepository productRepository,
            IProductVariantRepository productVariantRepository,
            IReturnRepository returnRepository,
            IGenaricRepository<OrderItem> orderItemRepository,
            IGenaricRepository<SellerCommission> sellerCommissionRepository,
            IGenaricRepository<Notification> notificationRepository)
        {
            _context = context;
            RefreshTokenRepository = refreshTokenRepository;
            OrderRepository = orderRepository;
            SubOrderRepository = subOrderRepository;
            CartRepository = cartRepository;
            CouponRepository = couponRepository;
            AddressRepository = addressRepository;
            SellerRepository = sellerRepository;
            ShippingRepository = shippingRepository;
            ProductRepository = productRepository;
            ProductVariantRepository = productVariantRepository;
            ReturnRepository = returnRepository;

            OrderItemRepository = orderItemRepository;
            SellerCommissionRepository = sellerCommissionRepository;
            NotificationRepository = notificationRepository;
        }

        public async Task<int> CompleteAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task BeginTransactionAsync()
        {
            await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            if (_context.Database.CurrentTransaction != null)
            {
                await _context.Database.CurrentTransaction.CommitAsync();
            }
        }

        public async Task RollbackTransactionAsync()
        {
            if (_context.Database.CurrentTransaction != null)
            {
                await _context.Database.CurrentTransaction.RollbackAsync();
                await _context.Database.CurrentTransaction.DisposeAsync();
            }
        }
    }
}