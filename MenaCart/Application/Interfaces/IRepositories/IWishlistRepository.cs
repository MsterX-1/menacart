using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IRepositories
{
    public interface IWishlistRepository : IGenaricRepository<Wishlist>
    {
        Task<IEnumerable<Wishlist>> GetByUserIdAsync(string userId);
        Task<Wishlist?> GetByUserAndVariantAsync(string userId, int variantId);
    }
}
