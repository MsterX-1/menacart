using Application.DTOs.LoyaltyDtos;
using System.Threading.Tasks;

namespace Application.Interfaces.IServices
{
    public interface ILoyaltyService
    {
        Task<LoyaltyResponseDto> GetLoyaltyDetailsAsync(string userId);
    }
}
