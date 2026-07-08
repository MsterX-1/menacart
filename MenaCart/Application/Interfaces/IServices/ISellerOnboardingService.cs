using Application.DTOs.SellerDtos;
using System.Threading.Tasks;

namespace Application.Interfaces.IServices
{
    public interface ISellerOnboardingService
    {
        Task<SellerProfileResponseDto> ApplyAsync(string userId, ApplySellerDto request);
        Task<SellerProfileResponseDto> GetProfileAsync(string userId);
        Task<SellerProfileResponseDto> GetProfileByIdAsync(int sellerId);
        Task<SellerProfileResponseDto> UpdateProfileAsync(string userId, ApplySellerDto request);
    }
}
