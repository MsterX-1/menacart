using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Repositories
{
    public class WishlistRepository : GenaricRepository<Wishlist>, IWishlistRepository
    {
        public WishlistRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Wishlist>> GetByUserIdAsync(string userId)
        {
            return await _context.Wishlists
                .Where(w => w.UserId == userId)
                .Include(w => w.ProductVariant)
                    .ThenInclude(pv => pv.Product)
                .OrderByDescending(w => w.AddedAt)
                .ToListAsync();
        }

        public async Task<Wishlist?> GetByUserAndVariantAsync(string userId, int variantId)
        {
            return await _context.Wishlists
                .FirstOrDefaultAsync(w => w.UserId == userId && w.VariantId == variantId);
        }
    }
}
