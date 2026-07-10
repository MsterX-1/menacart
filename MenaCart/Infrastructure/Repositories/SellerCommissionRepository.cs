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
    public class SellerCommissionRepository : GenaricRepository<SellerCommission>, ISellerCommissionRepository
    {
        public SellerCommissionRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<SellerCommission>> GetBySubOrderIdAsync(int subOrderId)
        {
            return await _dbSet
                .Where(sc => sc.OrderItem.SubOrderId == subOrderId)
                .Include(sc => sc.OrderItem)
                .ToListAsync();
        }

        public async Task<IEnumerable<SellerCommission>> GetSettledCommissionsBySellerIdAsync(int sellerId)
        {
            var pendingToSettle = await _dbSet
                .Where(sc => sc.SellerId == sellerId && sc.Status == SellerCommissionStatus.Pending && sc.SettlesAt <= System.DateTime.UtcNow)
                .ToListAsync();

            if (pendingToSettle.Any())
            {
                foreach (var sc in pendingToSettle) sc.Status = SellerCommissionStatus.Settled;
                await _context.SaveChangesAsync();
            }

            return await _dbSet
                .Where(sc => sc.SellerId == sellerId && sc.Status == SellerCommissionStatus.Settled && sc.PayoutId == null)
                .Include(sc => sc.OrderItem)
                .ToListAsync();
        }

        public async Task<IEnumerable<SellerCommission>> GetCommissionsByPayoutIdAsync(int payoutId)
        {
            return await _dbSet
                .Where(sc => sc.PayoutId == payoutId)
                .Include(sc => sc.OrderItem)
                .ToListAsync();
        }
    }
}
