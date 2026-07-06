using Application.DTOs.CartDtos;

namespace Application.Interfaces.IServices
{
    public interface ICartService
    {
        Task<CartResponseDto> GetCartAsync(string userId);
        Task<CartResponseDto> AddItemAsync(string userId, AddCartItemDto request);
        Task<CartResponseDto> UpdateItemAsync(string userId, int cartItemId, UpdateCartItemDto request);
        Task RemoveItemAsync(string userId, int cartItemId);
        Task ClearCartAsync(string userId);
    }
}
