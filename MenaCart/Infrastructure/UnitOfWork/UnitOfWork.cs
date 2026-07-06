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

        // Private backing fields for the generic repositories
        private IGenaricRepository<OrderItem>? _orderItemRepository;
        private IGenaricRepository<SellerCommission>? _sellerCommissionRepository;
        private IGenaricRepository<Notification>? _notificationRepository;

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
            IProductVariantRepository productVariantRepository)
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
        }

        // Lazy-loaded Generic Repository Properties
        public IGenaricRepository<OrderItem> OrderItemRepository => 
            _orderItemRepository ??= new GenaricRepository<OrderItem>(_context);

        public IGenaricRepository<SellerCommission> SellerCommissionRepository => 
            _sellerCommissionRepository ??= new GenaricRepository<SellerCommission>(_context);

        public IGenaricRepository<Notification> NotificationRepository => 
            _notificationRepository ??= new GenaricRepository<Notification>(_context);

        public async Task<int> CompleteAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}