using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Repository
{
    public class ReviewRepository : GenaricRepository<Review>, IReviewRepository
    {
        public ReviewRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<Review>> GetByProductIdAsync(int productId, int page, int pageSize)
        {
            return await _dbSet
                .Include(r => r.User)
                .Where(r => r.ProductId == productId)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<bool> HasUserPurchasedProductAsync(string userId, int productId)
        {
            return await _context.OrderItems
                .AnyAsync(oi => oi.SubOrder.Order.UserId == userId 
                             && oi.ProductVariant.ProductId == productId 
                             && oi.SubOrder.Status == SubOrderStatus.Delivered);
        }

        public async Task<bool> HasUserReviewedProductAsync(string userId, int productId)
        {
            return await _dbSet.AnyAsync(r => r.UserId == userId && r.ProductId == productId);
        }

        public async Task<decimal> GetAverageRatingForProductAsync(int productId)
        {
            var average = await _dbSet
                .Where(r => r.ProductId == productId)
                .AverageAsync(r => (double?)r.Rating);

            return (decimal)(average ?? 0.0);
        }

        public async Task<int> GetReviewCountForProductAsync(int productId)
        {
            return await _dbSet.CountAsync(r => r.ProductId == productId);
        }
    }
}
