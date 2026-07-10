using Application.DTOs.WishlistDtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IServices
{
    public interface IWishlistService
    {
        Task<IEnumerable<WishlistResponseDto>> GetWishlistAsync(string userId);
        Task AddToWishlistAsync(string userId, AddToWishlistRequestDto dto);
        Task RemoveFromWishlistAsync(string userId, int variantId);
        Task<bool> IsInWishlistAsync(string userId, int variantId);
    }
}
