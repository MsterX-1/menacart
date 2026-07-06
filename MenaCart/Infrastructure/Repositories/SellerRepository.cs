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

        public async Task<IEnumerable<SellerProfile>> GetAllWithUserAsync(
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

            return await query
                .OrderByDescending(s => s.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }
    }
}
