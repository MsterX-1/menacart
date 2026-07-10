using Application.DTOs.CouponDtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IServices
{
    public interface ICouponService
    {
        Task<CouponResponseDto> CreateCouponAsync(CreateCouponDto request);
        Task<CouponResponseDto> UpdateCouponAsync(int id, CreateCouponDto request);
        Task DeleteCouponAsync(int id);
        Task<IEnumerable<CouponResponseDto>> GetAllCouponsAsync();
        Task<CouponResponseDto> GetCouponByCodeAsync(string code);
    }
}
