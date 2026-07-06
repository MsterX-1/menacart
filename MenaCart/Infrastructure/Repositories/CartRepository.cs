using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository
{
    public class CartRepository : GenaricRepository<Cart>, ICartRepository
    {

        public CartRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Cart?> GetCartWithItemsByUserIdAsync(string userId)
        {
            return await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.ProductVariant)
                        .ThenInclude(v => v.Product)
                            .ThenInclude(p => p.SellerProfile)
                .FirstOrDefaultAsync(c => c.UserId == userId);
        }

        public async Task ClearCartItemsAsync(int cartId)
        {
            var items = await _context.CartItems
                .Where(ci => ci.CartId == cartId)
                .ToListAsync();

            _context.CartItems.RemoveRange(items);
        }
    }
}