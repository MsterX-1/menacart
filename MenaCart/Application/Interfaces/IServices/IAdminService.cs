using Application.DTOs.UserDtos.AdminDtos;

namespace Application.Interfaces.IServices
{
    public interface IAdminService
    {
        // Seller management
        Task<SellerResponseDto> UpdateSellerStatusAsync(int sellerId, UpdateSellerStatusDto request);
        Task BanSellerEmailAsync(int sellerId, BanSellerEmailDto request);
        Task SendWarningAsync(int sellerId, SendWarningDto request);
        Task<AdminSellersPagedResponseDto> GetAllSellersAsync(string? status, int page, int pageSize);
        Task UpdateSellerCommissionAsync(int sellerId, decimal? commissionRate);

        // Coupons
        Task<CouponResponseDto> CreateCouponAsync(CreateCouponDto request);
        Task<IEnumerable<CouponResponseDto>> GetAllCouponsAsync();
        Task DeleteCouponAsync(int couponId);

        // Dashboard
        Task<AdminDashboardStatsDto> GetDashboardStatsAsync();
    }
}
