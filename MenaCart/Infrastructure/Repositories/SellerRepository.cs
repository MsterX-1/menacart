using Application.DTOs.SellerDtos;
using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository
{
    public class SellerRepository : GenaricRepository<SellerProfile>, ISellerRepository
    {
        public SellerRepository(AppDbContext context) : base(context) { }

        public async Task<SellerProfile?> GetByUserIdAsync(string userId)
        {
            return await _dbSet
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId);
        }

        public async Task<SellerProfile?> GetByIdWithUserAsync(int sellerId)
        {
            return await _dbSet
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.SellerId == sellerId);
        }

        public async Task<(IEnumerable<SellerProfile> Items, int TotalCount)> GetAllWithUserAsync(
            string? statusFilter, int page, int pageSize)
        {
            var query = _dbSet
                .Include(s => s.User)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(statusFilter)
                && Enum.TryParse<SellerStatus>(statusFilter, ignoreCase: true, out var parsed))
            {
                query = query.Where(s => s.Status == parsed);
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(s => s.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }
        public async Task<SellerDashboardStatsDto> GetSellerDashboardStatsAsync(int sellerId)
        {
            var totalOrders = await _context.SubOrders
                .CountAsync(so => so.SellerId == sellerId && so.Order.PaymentStatus == OrderPaymentStatus.Paid);

            var totalProducts = await _context.Products
                .CountAsync(p => p.SellerId == sellerId);

            var commissions = await _context.SellerCommissions
                .Where(sc => sc.SellerId == sellerId && sc.Status == SellerCommissionStatus.Settled)
                .ToListAsync();

            var totalRevenue = commissions.Sum(c => c.SaleAmount);
            var totalCommissionPaid = commissions.Sum(c => c.CommissionAmount);
            var netProfit = totalRevenue - totalCommissionPaid;

            var pendingPayoutBalance = await _context.SellerPayouts
                .Where(p => p.SellerId == sellerId && (p.Status == SellerPayoutStatus.Pending || p.Status == SellerPayoutStatus.Processing))
                .SumAsync(p => (decimal?)p.Amount) ?? 0m;

            var topProducts = await _context.OrderItems
                .Include(oi => oi.ProductVariant)
                    .ThenInclude(pv => pv.Product)
                .Where(oi => oi.ProductVariant.Product.SellerId == sellerId)
                .GroupBy(oi => oi.ProductVariant.ProductId)
                .Select(g => new TopSellerProductDto
                {
                    ProductId = g.Key,
                    Name = g.Select(oi => oi.ProductVariant.Product.Name).FirstOrDefault() ?? "Unknown",
                    TotalSold = g.Sum(oi => oi.Quantity),
                    Revenue = g.Sum(oi => oi.PriceAtPurchase * oi.Quantity),
                    AverageRating = (double)(g.Select(oi => oi.ProductVariant.Product.AverageRating).FirstOrDefault())
                })
                .OrderByDescending(p => p.TotalSold)
                .Take(5)
                .ToListAsync();

            return new SellerDashboardStatsDto
            {
                TotalRevenue = totalRevenue,
                TotalCommissionPaid = totalCommissionPaid,
                NetProfit = netProfit,
                TotalOrders = totalOrders,
                TotalProducts = totalProducts,
                PendingPayoutBalance = pendingPayoutBalance,
                TopProducts = topProducts
            };
        }
        public async Task<(IEnumerable<SellerProfile> Items, int TotalCount)> GetActiveSellersAsync(string? search, int page, int pageSize)
        {
            var query = _dbSet
                .Where(s => s.Status == SellerStatus.Active);

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(s => s.StoreName.Contains(search) || s.StoreDescription.Contains(search));
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(s => s.Rating)
                .ThenByDescending(s => s.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }
    }
}
