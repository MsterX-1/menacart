using Application.DTOs.PayoutDtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IServices
{
    public interface IPayoutService
    {
        Task<PayoutResponseDto> RequestPayoutAsync(string userId, RequestPayoutDto request);
        Task<IEnumerable<PayoutResponseDto>> GetMyPayoutsAsync(string userId);
        Task<IEnumerable<PayoutResponseDto>> GetAllPayoutsForAdminAsync(string? statusFilter);
        Task<PayoutResponseDto> ReviewPayoutAsync(int payoutId, ReviewPayoutDto request);
    }
}
