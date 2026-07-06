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
                .FirstOrDefaultAsync(s => s.UserId == userId);
        }
    }
}