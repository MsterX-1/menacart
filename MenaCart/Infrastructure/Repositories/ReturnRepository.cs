using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository
{
    public class ReturnRepository : GenaricRepository<Return>, IReturnRepository
    {
        public ReturnRepository(AppDbContext context) : base(context) { }

        public async Task<Return?> GetByIdWithDetailsAsync(int returnId)
        {
            return await _dbSet
                .Include(r => r.OrderItem)
                    .ThenInclude(oi => oi.ProductVariant)
                        .ThenInclude(v => v.Product)
                .Include(r => r.OrderItem)
                    .ThenInclude(oi => oi.SubOrder)
                        .ThenInclude(s => s.Order)
                .Include(r => r.ExchangeVariant)
                .FirstOrDefaultAsync(r => r.ReturnId == returnId);
        }

        public async Task<IEnumerable<Return>> GetByUserIdAsync(string userId, int page, int pageSize)
        {
            return await _dbSet
                .Include(r => r.OrderItem)
                    .ThenInclude(oi => oi.ProductVariant)
                        .ThenInclude(v => v.Product)
                .Include(r => r.OrderItem)
                    .ThenInclude(oi => oi.SubOrder)
                        .ThenInclude(s => s.Order)
                .Include(r => r.ExchangeVariant)
                .Where(r => r.OrderItem.SubOrder.Order.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<Return>> GetBySellerIdAsync(int sellerId, int page, int pageSize)
        {
            return await _dbSet
                .Include(r => r.OrderItem)
                    .ThenInclude(oi => oi.ProductVariant)
                        .ThenInclude(v => v.Product)
                .Include(r => r.OrderItem)
                    .ThenInclude(oi => oi.SubOrder)
                        .ThenInclude(s => s.Order)
                .Include(r => r.ExchangeVariant)
                .Where(r => r.OrderItem.SubOrder.SellerId == sellerId)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }
    }
}
