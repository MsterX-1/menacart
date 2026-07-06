using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository
{
    public class SubOrderRepository : GenaricRepository<SubOrder>, ISubOrderRepository
    {
        public SubOrderRepository(AppDbContext context) : base(context) { }

        public async Task<SubOrder?> GetByIdWithDetailsAsync(int subOrderId)
        {
            return await _dbSet
                .Include(s => s.SellerProfile)
                .Include(s => s.OrderItems)
                    .ThenInclude(i => i.ProductVariant)
                        .ThenInclude(v => v.Product)
                .Include(s => s.Shipping)
                .FirstOrDefaultAsync(s => s.SubOrderId == subOrderId);
        }

        public async Task<IEnumerable<SubOrder>> GetBySellerIdAsync(
            int sellerId, string? statusFilter, int page, int pageSize)
        {
            var query = _dbSet
                .Where(s => s.SellerId == sellerId)
                .Include(s => s.SellerProfile)
                .Include(s => s.OrderItems)
                    .ThenInclude(i => i.ProductVariant)
                        .ThenInclude(v => v.Product)
                .Include(s => s.Shipping)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(statusFilter)
                && Enum.TryParse<SubOrderStatus>(statusFilter, ignoreCase: true, out var parsed))
            {
                query = query.Where(s => s.Status == parsed);
            }

            return await query
                .OrderByDescending(s => s.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }
    }
}