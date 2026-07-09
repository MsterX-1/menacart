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
                .FirstOrDefaultAsync(o => o.OrderId == orderId);
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
            var totalSellers = await _context.SellerProfiles.CountAsync();
            var totalProducts = await _context.Products.CountAsync();
            var totalOrders = await _context.Orders.CountAsync();
            
            var totalRevenue = await _context.Orders
                .Where(o => o.PaymentStatus == OrderPaymentStatus.Paid)
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0m;

            var pendingSellerApps = await _context.SellerProfiles
                .CountAsync(sp => sp.Status == SellerStatus.Pending);

            var pendingPayouts = await _context.SellerPayouts
                .CountAsync(sp => sp.Status == SellerPayoutStatus.Pending);

            var platformCommissionProfit = await _context.SellerCommissions
                .Where(sc => sc.Status == SellerCommissionStatus.Settled)
                .SumAsync(sc => (decimal?)sc.CommissionAmount) ?? 0m;

            // Top Selling Products
            var topProducts = await _context.OrderItems
                .Include(oi => oi.ProductVariant)
                    .ThenInclude(pv => pv.Product)
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
                .Select(sp => new SellerRevenueDto
                {
                    SellerId = sp.SellerId,
                    StoreName = sp.StoreName,
                    TotalRevenue = _context.SellerCommissions
                        .Where(sc => sc.SellerId == sp.SellerId && sc.Status == SellerCommissionStatus.Settled)
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
    }
}