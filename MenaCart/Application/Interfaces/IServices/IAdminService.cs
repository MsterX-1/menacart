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
        Task<AdminTransactionsPagedResponseDto> GetTransactionsAsync(int page, int pageSize);
        Task<AdminTransactionDetailDto?> GetTransactionDetailsAsync(int orderId);
        // Settings
        Task<SystemSettingDto?> GetSystemSettingAsync(string key);
        Task<SystemSettingDto> UpdateSystemSettingAsync(string key, string value);
    }
}
