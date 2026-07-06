using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository
{
    public class ShippingRepository : GenaricRepository<Shipping>, IShippingRepository
    {
        public ShippingRepository(AppDbContext context) : base(context) { }

        public async Task<Shipping?> GetBySubOrderIdAsync(int subOrderId)
        {
            return await _dbSet
                .FirstOrDefaultAsync(s => s.SubOrderId == subOrderId);
        }
    }
}
