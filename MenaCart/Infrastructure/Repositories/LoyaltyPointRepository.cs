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
    public class LoyaltyPointRepository : GenaricRepository<LoyaltyPoint>, ILoyaltyPointRepository
    {
        public LoyaltyPointRepository(AppDbContext context) : base(context) { }

        public async Task<int> GetBalanceByUserIdAsync(string userId)
        {
            var sum = await _dbSet
                .Where(lp => lp.UserId == userId)
                .SumAsync(lp => (int?)lp.Points);

            return sum ?? 0;
        }

        public async Task<IEnumerable<LoyaltyPoint>> GetLedgerByUserIdAsync(string userId)
        {
            return await _dbSet
                .Where(lp => lp.UserId == userId)
                .OrderByDescending(lp => lp.CreatedAt)
                .ToListAsync();
        }
    }
}
