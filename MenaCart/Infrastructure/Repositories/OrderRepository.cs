using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository
{
    public class OrderRepository : GenaricRepository<Order>, IOrderRepository
    {

        public OrderRepository(AppDbContext context) : base(context)
        {
        }

  

        public async Task<Order?> GetByIdWithDetailsAsync(int orderId)
        {
            return await _context.Orders
                .Include(o => o.SubOrders)
                    .ThenInclude(s => s.SellerProfile)
                .Include(o => o.SubOrders)
                    .ThenInclude(s => s.OrderItems)
                        .ThenInclude(i => i.ProductVariant)
                            .ThenInclude(v => v.Product)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);
        }

        public async Task<IEnumerable<Order>> GetByUserIdAsync(string userId, int page, int pageSize)
        {
            return await _context.Orders
                .Where(o => o.UserId == userId)
                .Include(o => o.SubOrders)
                    .ThenInclude(s => s.SellerProfile)
                .Include(o => o.SubOrders)
                    .ThenInclude(s => s.OrderItems)
                        .ThenInclude(i => i.ProductVariant)
                            .ThenInclude(v => v.Product)
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }
    }
}