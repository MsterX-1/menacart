using Domain.Models;

namespace Application.Interfaces.IRepositories
{
    // Inherit the generic CRUD methods, and add your specific cart methods
    public interface ICartRepository : IGenaricRepository<Cart>
    {
        Task<Cart?> GetCartWithItemsByUserIdAsync(string userId);
        Task ClearCartItemsAsync(int cartId);
    }
}