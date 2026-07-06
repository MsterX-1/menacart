using Application.DTOs.UserDtos.AdminDtos;

namespace Application.Interfaces.IServices
{
    public interface IAdminService
    {
        // Seller management
        Task<SellerResponseDto> UpdateSellerStatusAsync(int sellerId, UpdateSellerStatusDto request);
        Task BanSellerEmailAsync(int sellerId, BanSellerEmailDto request);
        Task SendWarningAsync(int sellerId, SendWarningDto request);
        Task<IEnumerable<SellerResponseDto>> GetAllSellersAsync(string? status, int page, int pageSize);

        // Coupons
        Task<CouponResponseDto> CreateCouponAsync(CreateCouponDto request);
        Task<IEnumerable<CouponResponseDto>> GetAllCouponsAsync();
        Task DeleteCouponAsync(int couponId);
    }
}
