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
    public class SellerReviewRepository : GenaricRepository<SellerReview>, ISellerReviewRepository
    {
        public SellerReviewRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<SellerReview>> GetBySellerIdAsync(int sellerId, int page, int pageSize)
        {
            return await _dbSet
                .Include(sr => sr.Customer)
                .Where(sr => sr.SellerId == sellerId)
                .OrderByDescending(sr => sr.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<bool> HasUserPurchasedFromSellerAsync(string userId, int sellerId)
        {
            return await _context.SubOrders
                .AnyAsync(so => so.Order.UserId == userId 
                             && so.SellerId == sellerId 
                             && so.Status == SubOrderStatus.Delivered);
        }

        public async Task<bool> HasUserReviewedSellerAsync(string userId, int sellerId)
        {
            return await _dbSet.AnyAsync(sr => sr.CustomerId == userId && sr.SellerId == sellerId);
        }

        public async Task<decimal> GetAverageRatingForSellerAsync(int sellerId)
        {
            var average = await _dbSet
                .Where(sr => sr.SellerId == sellerId)
                .AverageAsync(sr => (double?)sr.Rating);

            return (decimal)(average ?? 0.0);
        }
    }
}
