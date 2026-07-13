using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Application.DTOs.UserDtos.AdminDtos;

namespace Infrastructure.Repository
{
    public class OrderRepository : GenaricRepository<Order>, IOrderRepository
    {

        public OrderRepository(AppDbContext context) : base(context)
        {
        }

  

        public async Task<Order?> GetByIdWithDetailsAsync(int orderId)
        {
            return await _context.Orders
                .Include(o => o.SubOrders)
                    .ThenInclude(s => s.SellerProfile)
                .Include(o => o.SubOrders)
                    .ThenInclude(s => s.OrderItems)
                        .ThenInclude(i => i.ProductVariant)
                            .ThenInclude(v => v.Product)
                .Include(o => o.SubOrders)
                    .ThenInclude(s => s.OrderItems)
                        .ThenInclude(i => i.SellerCommissions)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);
        }

        public async Task<(IEnumerable<Order> Orders, int TotalCount)> GetAllWithDetailsAsync(int page, int pageSize)
        {
            var query = _context.Orders
                .Include(o => o.User)
                .Include(o => o.Address)
                .Include(o => o.SubOrders)
                    .ThenInclude(s => s.SellerProfile)
                .Include(o => o.SubOrders)
                    .ThenInclude(s => s.OrderItems)
                        .ThenInclude(i => i.ProductVariant)
                            .ThenInclude(v => v.Product)
                .Include(o => o.SubOrders)
                    .ThenInclude(s => s.Shipping)
                .Include(o => o.SubOrders)
                    .ThenInclude(s => s.OrderItems)
                        .ThenInclude(oi => oi.SellerCommissions);

            var totalCount = await query.CountAsync();

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (orders, totalCount);
        }

        public async Task<IEnumerable<Order>> GetByUserIdAsync(string userId, int page, int pageSize)
        {
            return await _context.Orders
                .Where(o => o.UserId == userId)
                .Include(o => o.SubOrders)
                    .ThenInclude(s => s.SellerProfile)
                .Include(o => o.SubOrders)
                    .ThenInclude(s => s.OrderItems)
                        .ThenInclude(i => i.ProductVariant)
                            .ThenInclude(v => v.Product)
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<AdminDashboardStatsDto> GetAdminDashboardStatsAsync(int totalUsersCount)
        {
            var totalSellers = await _context.SellerProfiles.CountAsync(sp => sp.Status == SellerStatus.Active);
            var totalProducts = await _context.Products.CountAsync();
            var totalOrders = await _context.Orders.CountAsync(o => o.Status != OrderStatus.Cancelled);
            
            var totalRevenue = await _context.OrderItems
                .Where(oi => oi.SubOrder.Order.Status == OrderStatus.Completed && oi.SubOrder.Order.PaymentStatus == OrderPaymentStatus.Paid)
                .SumAsync(oi => (decimal?)(oi.PriceAtPurchase * oi.Quantity)) ?? 0m;

            var pendingSellerApps = await _context.SellerProfiles
                .CountAsync(sp => sp.Status == SellerStatus.Pending);

            var pendingPayouts = await _context.SellerPayouts
                .CountAsync(sp => sp.Status == SellerPayoutStatus.Pending);

            var totalCommissions = await _context.SellerCommissions
                .Where(sc => sc.Status == SellerCommissionStatus.Settled)
                .SumAsync(sc => (decimal?)sc.CommissionAmount) ?? 0m;

            var totalPlatformDiscounts = await _context.Orders
                .Where(o => o.Status == OrderStatus.Completed && o.PaymentStatus == OrderPaymentStatus.Paid)
                .SumAsync(o => (decimal?)o.PlatformDiscount) ?? 0m;

            var platformCommissionProfit = totalCommissions - totalPlatformDiscounts;

            // Top Selling Products
            var topProducts = await _context.OrderItems
                .Include(oi => oi.SubOrder)
                    .ThenInclude(so => so.Order)
                .Include(oi => oi.ProductVariant)
                    .ThenInclude(pv => pv.Product)
                .Where(oi => oi.SubOrder.Order.Status == OrderStatus.Completed && oi.SubOrder.Order.PaymentStatus == OrderPaymentStatus.Paid)
                .GroupBy(oi => oi.ProductVariant.ProductId)
                .Select(g => new TopProductDto
                {
                    ProductId = g.Key,
                    Name = g.Select(oi => oi.ProductVariant.Product.Name).FirstOrDefault() ?? "Unknown Product",
                    TotalSold = g.Sum(oi => oi.Quantity),
                    Revenue = g.Sum(oi => oi.PriceAtPurchase * oi.Quantity),
                    AverageRating = (double)(g.Select(oi => oi.ProductVariant.Product.AverageRating).FirstOrDefault())
                })
                .OrderByDescending(p => p.TotalSold)
                .Take(5)
                .ToListAsync();

            // Seller Revenues
            var sellerRevenues = await _context.SellerProfiles
                .Where(sp => sp.Status == SellerStatus.Active)
                .Select(sp => new SellerRevenueDto
                {
                    SellerId = sp.SellerId,
                    StoreName = sp.StoreName,
                    TotalRevenue = _context.SellerCommissions
                        .Where(sc => sc.SellerId == sp.SellerId && (sc.Status == SellerCommissionStatus.Settled || sc.Status == SellerCommissionStatus.Pending))
                        .Sum(sc => (decimal?)sc.SaleAmount) ?? 0m,
                    PendingRevenue = _context.SellerCommissions
                        .Where(sc => sc.SellerId == sp.SellerId && sc.Status == SellerCommissionStatus.Pending)
                        .Sum(sc => (decimal?)sc.SaleAmount) ?? 0m,
                    PendingPayoutBalance = _context.SellerPayouts
                        .Where(p => p.SellerId == sp.SellerId && (p.Status == SellerPayoutStatus.Pending || p.Status == SellerPayoutStatus.Processing))
                        .Sum(p => (decimal?)p.Amount) ?? 0m
                })
                .OrderByDescending(sr => sr.TotalRevenue)
                .Take(5)
                .ToListAsync();

            return new AdminDashboardStatsDto
            {
                TotalUsers = totalUsersCount,
                TotalSellers = totalSellers,
                TotalProducts = totalProducts,
                TotalOrders = totalOrders,
                TotalRevenue = totalRevenue,
                PendingSellerApplications = pendingSellerApps,
                PendingPayouts = pendingPayouts,
                PlatformCommissionProfit = platformCommissionProfit,
                TopProducts = topProducts,
                SellerRevenues = sellerRevenues
            };
        }

        public async Task<(IEnumerable<AdminTransactionDto> Items, int TotalCount)> GetAdminTransactionsAsync(int page, int pageSize)
        {
            var query = _dbSet
                .Include(o => o.User)
                .Where(o => o.Status != OrderStatus.Cancelled)
                .AsQueryable();

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new AdminTransactionDto
                {
                    OrderId = o.OrderId,
                    CustomerName = o.User.FirstName + " " + o.User.LastName,
                    CustomerEmail = o.User.Email,
                    TotalAmount = o.TotalAmount,
                    PaymentMethod = "Stripe", // Currently only Stripe is supported for orders
                    PaymentStatus = o.PaymentStatus.ToString(),
                    OrderStatus = o.Status.ToString(),
                    CreatedAt = o.CreatedAt
                })
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<AdminTransactionDetailDto?> GetAdminTransactionByIdAsync(int orderId)
        {
            var order = await _dbSet
                .Include(o => o.User)
                .Include(o => o.Coupon)
                .Include(o => o.SubOrders)
                    .ThenInclude(so => so.SellerProfile)
                .Include(o => o.SubOrders)
                    .ThenInclude(so => so.Shipping)
                .Include(o => o.SubOrders)
                    .ThenInclude(so => so.OrderItems)
                        .ThenInclude(oi => oi.ProductVariant)
                            .ThenInclude(pv => pv.Product)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null) return null;

            var dto = new AdminTransactionDetailDto
            {
                OrderId = order.OrderId,
                CustomerName = order.User.FirstName + " " + order.User.LastName,
                CustomerEmail = order.User.Email,
                TotalAmount = order.TotalAmount,
                PlatformDiscount = order.PlatformDiscount,
                CouponDiscount = order.PlatformDiscount + (order.SubOrders != null ? order.SubOrders.SelectMany(so => so.OrderItems).SelectMany(oi => oi.SellerCommissions ?? new List<Domain.Models.SellerCommission>()).Sum(sc => sc.SellerDiscount) : 0),
                CouponCode = order.Coupon?.Code,
                OrderStatus = order.Status.ToString(),
                PaymentStatus = order.PaymentStatus.ToString(),
                PaymentMethod = "Stripe", // Same hardcoding for now
                CreatedAt = order.CreatedAt,
                SubOrders = order.SubOrders.Select(so => new AdminSubOrderDto
                {
                    SubOrderId = so.SubOrderId,
                    SellerId = so.SellerId,
                    StoreName = so.SellerProfile?.StoreName ?? "Unknown",
                    Status = so.Status.ToString(),
                    ShippingCost = so.ShippingCost,
                    Carrier = so.Shipping?.Carrier,
                    TrackingNumber = so.Shipping?.TrackingNumber,
                    Items = so.OrderItems.Select(oi => new AdminOrderItemDto
                    {
                        ProductName = oi.ProductVariant?.Product?.Name ?? "Unknown",
                        Color = oi.ProductVariant?.Color,
                        Size = oi.ProductVariant?.Size,
                        Quantity = oi.Quantity,
                        PriceAtPurchase = oi.PriceAtPurchase,
                        SaleAmount = oi.Quantity * oi.PriceAtPurchase
                    }).ToList(),
                    SubOrderTotal = so.ShippingCost + so.OrderItems.Sum(oi => oi.Quantity * oi.PriceAtPurchase)
                }).ToList()
            };

            return dto;
        }
    }
}