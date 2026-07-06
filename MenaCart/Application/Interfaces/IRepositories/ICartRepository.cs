using Domain.Models;

namespace Application.Interfaces.IRepositories
{
    public interface ICartRepository : IGenaricRepository<Cart>
    {
        Task<Cart?> GetCartWithItemsByUserIdAsync(string userId);
        Task ClearCartItemsAsync(int cartId);

        // CartItem operations
        Task<CartItem?> GetCartItemByIdAsync(int cartItemId);
        Task AddCartItemAsync(CartItem cartItem);
        Task RemoveCartItemAsync(int cartItemId);
    }
}
